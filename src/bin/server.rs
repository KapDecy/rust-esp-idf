//! HTTP Server with JSON POST handler
//!
//! Go to 192.168.71.1 to test

use core::convert::TryInto;
use std::{
    net::Ipv4Addr,
    thread::{self},
};

use embedded_svc::{
    http::{Headers, Method},
    io::{Read, Write},
    wifi::{self, AccessPointConfiguration, AuthMethod},
};

use esp_idf_svc::{
    eventloop::EspSystemEventLoop,
    http::server::EspHttpServer,
    ipv4::{Mask, RouterConfiguration, Subnet},
    netif::NetifConfiguration,
    nvs::EspDefaultNvsPartition,
    wifi::{BlockingWifi, EspWifi},
};
use esp_idf_svc::{
    hal::{
        ledc::{config::TimerConfig, LedcDriver, LedcTimerDriver},
        prelude::Peripherals,
        units::Hertz,
    },
    netif::EspNetif,
    wifi::WifiDriver,
};

use log::*;

use serde::Deserialize;
use serde_json::json;

const SSID: &str = env!("WIFI_SSID");
const PASSWORD: &str = env!("WIFI_PASS");
static INDEX_HTML: &str = include_str!("../http_server_page.html");
static APPJS: &str = include_str!("../app.js");
static STYLECSS: &str = include_str!("../style.css");
static FAVICON: &'static [u8; 64190] = include_bytes!("../favicon.ico");

// Max payload length
const MAX_LEN: usize = 128;

// Need lots of stack to parse JSON
const STACK_SIZE: usize = 10240;

// Wi-Fi channel, between 1 and 11
const CHANNEL: u8 = 11;

#[derive(Deserialize, Debug)]
struct FormData {
    lp: f32,
}
#[derive(Deserialize, Debug)]
struct SetHzData {
    first: u64,
    second: u64,
}

fn main() -> anyhow::Result<()> {
    esp_idf_svc::sys::link_patches();
    esp_idf_svc::log::EspLogger::initialize_default();

    // Setup Wifi

    let peripherals = Peripherals::take()?;

    // let mut led = PinDriver::output(peripherals.pins.gpio0)?;
    let led = LedcTimerDriver::new(
        peripherals.ledc.timer0,
        &TimerConfig::default().frequency(Hertz(500)),
    )?;
    let mut led = LedcDriver::new(peripherals.ledc.channel0, led, peripherals.pins.gpio0)?;

    let (sendr, recvr) = std::sync::mpsc::channel();

    let sys_loop = EspSystemEventLoop::take()?;
    let nvs = EspDefaultNvsPartition::take()?;

    let espwifi = EspWifi::wrap_all(
        WifiDriver::new(peripherals.modem, sys_loop.clone(), Some(nvs))?,
        EspNetif::new(esp_idf_svc::netif::NetifStack::Sta)?,
        EspNetif::new_with_conf(&NetifConfiguration {
            ip_configuration: Some(esp_idf_svc::ipv4::Configuration::Router(
                RouterConfiguration {
                    subnet: Subnet {
                        gateway: Ipv4Addr::new(192, 168, 0, 1),
                        mask: Mask(24),
                    },
                    ..Default::default()
                },
            )),
            ..NetifConfiguration::wifi_default_router()
        })?,
    )?;

    let mut wifi = BlockingWifi::wrap(espwifi, sys_loop)?;

    connect_wifi(&mut wifi)?;

    let mut server = create_server()?;

    server.fn_handler("/", Method::Get, |req| {
        req.into_ok_response()?
            .write_all(INDEX_HTML.as_bytes())
            .map(|_| ())
    })?;

    server.fn_handler("/favicon.ico", Method::Get, |req| {
        // req.into_ok_response()?.write_all(FAVICON).map(|_| ())
        req.into_response(200, None, &[("Content-Type", "image/x-icon")])?
            .write_all(FAVICON)
            .map(|_| ())
    })?;

    server.fn_handler("/app.js", Method::Get, |req| {
        req.into_response(200, None, &[("Content-Type", "text/javascript")])?
            .write_all(APPJS.as_bytes())
            .map(|_| ())
    })?;

    server.fn_handler("/style.css", Method::Get, |req| {
        req.into_response(200, None, &[("Content-Type", "text/css")])?
            .write_all(STYLECSS.as_bytes())
            .map(|_| ())
    })?;

    server.fn_handler::<anyhow::Error, _>("/post", Method::Post, move |mut req| {
        let len = req.content_len().unwrap_or(0) as usize;

        if len > MAX_LEN {
            req.into_status_response(413)?
                .write_all("Request too big".as_bytes())?;
            return Ok(());
        }

        let mut buf = vec![0; len];
        req.read_exact(&mut buf)?;
        // error!("JSON ERROR\n{}", unsafe {
        //     String::from_utf8_unchecked(buf.clone())
        // });
        let mut resp = req.into_ok_response()?;

        if let Ok(form) = serde_json::from_slice::<FormData>(&buf) {
            info!("{:?}", form);
            write!(resp, "Light power: {}", form.lp)?;
            {
                // *dur.lock().unwrap() = form.age;
                // sendr.send(form.lp).unwrap();
            }
        } else {
            resp.write_all("JSON error".as_bytes())?;
            error!("JSON ERROR\n{}", unsafe {
                String::from_utf8_unchecked(buf)
            });
        }

        Ok(())
    })?;

    server.fn_handler::<anyhow::Error, _>("/set-hz", Method::Post, move |mut req| {
        let len = req.content_len().unwrap_or(0) as usize;

        if len > MAX_LEN {
            req.into_status_response(413)?
                .write_all("Request too big".as_bytes())?;
            return Ok(());
        }

        let mut buf = vec![0; len];
        req.read_exact(&mut buf)?;
        // error!("JSON ERROR\n{}", unsafe {
        //     String::from_utf8_unchecked(buf.clone())
        // });
        let mut resp = req.into_response(200, None, &[("Content-Type", "application/json")])?;

        if let Ok(form) = serde_json::from_slice::<SetHzData>(&buf) {
            info!("{:?}", form);
            let json_resp = json!({
                "success": true,
                "first": form.first,
                "second": form.second
            })
            .to_string();
            // write!(resp, json_resp.as_bytes())?;
            resp.write_all(json_resp.as_bytes())?;
            {
                // *dur.lock().unwrap() = form.age;
                sendr.send(form.first).unwrap();
            }
        } else {
            // TODO: write this
            resp.write_all("JSON error".as_bytes())?;
            error!("JSON ERROR\n{}", unsafe {
                String::from_utf8_unchecked(buf)
            });
        }

        Ok(())
    })?;

    server.fn_handler::<anyhow::Error, _>("/default", Method::Get, |req| {
        let json = json!({
            "current": [333, 666],
            "default-0": [228, 228],
            "default-1": [555, 555],
            "default-2": [777, 777],
        })
        .to_string();
        req.into_ok_response()?.write_all(json.as_bytes())?;

        Ok(())
    })?;

    // Keep wifi and the server running beyond when main() returns (forever)
    // Do not call this if you ever want to stop or access them later.
    // Otherwise you can either add an infinite loop so the main task
    // never returns, or you can move them to another thread.
    // https://doc.rust-lang.org/stable/core/mem/fn.forget.html

    core::mem::forget(wifi);
    core::mem::forget(server);

    // Main task no longer needed, free up some memory

    let thread = thread::spawn(move || {
        let md = led.get_max_duty();
        loop {
            let dur = recvr.recv().unwrap() as f32;
            led.set_duty((md as f32 * (dur / 1000.)) as u32).unwrap();
        }
    });

    core::mem::forget(thread);

    // thread.join().unwrap();
    Ok(())
}

fn connect_wifi(wifi: &mut BlockingWifi<EspWifi<'static>>) -> anyhow::Result<()> {
    // If instead of creating a new network you want to serve the page
    // on your local network, you can replace this configuration with
    // the client configuration from the http_client example.
    let wifi_configuration = wifi::Configuration::AccessPoint(AccessPointConfiguration {
        ssid: SSID.try_into().unwrap(),
        ssid_hidden: false,
        auth_method: AuthMethod::WPA2Personal,
        password: PASSWORD.try_into().unwrap(),
        channel: CHANNEL,
        ..Default::default()
    });

    wifi.set_configuration(&wifi_configuration)?;

    wifi.start()?;
    info!("Wifi started");

    // If using a client configuration you need
    // to connect to the network with:
    //
    //  ```
    //  wifi.connect()?;
    //  info!("Wifi connected");
    // ```

    wifi.wait_netif_up()?;
    info!("Wifi netif up");

    info!(
        "Created Wi-Fi with WIFI_SSID `{}` and WIFI_PASS `{}`",
        SSID, PASSWORD
    );

    Ok(())
}

fn create_server() -> anyhow::Result<EspHttpServer<'static>> {
    let server_configuration = esp_idf_svc::http::server::Configuration {
        stack_size: STACK_SIZE,
        ..Default::default()
    };

    Ok(EspHttpServer::new(&server_configuration)?)
}
