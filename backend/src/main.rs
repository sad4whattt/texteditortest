use actix_web::{web, App, HttpResponse, HttpServer, Responder, middleware::Logger};
use actix_cors::Cors;
use reqwest::Client;
use serde::{Deserialize, Serialize};
use std::env;
use dotenv::dotenv;

#[derive(Deserialize)]
struct ParaphraseRequest {
    text: String,
}

#[derive(Serialize)]
struct ParaphraseResponse {
    paraphrased: String,
}

async fn paraphrase_handler(req: web::Json<ParaphraseRequest>) -> impl Responder {
    println!("Received paraphrase request: {}", req.text);
    
    let api_key = match env::var("OPENAI_API_KEY") {
        Ok(key) => key,
        Err(_) => {
            println!("Error: OPENAI_API_KEY not set");
            return HttpResponse::InternalServerError().body("API key not set");
        }
    };

    let client = Client::new();
    let response = match client.post("https://api.openai.com/v1/chat/completions")
        .header("Authorization", format!("Bearer {}", api_key))
        .header("Content-Type", "application/json")
        .json(&serde_json::json!({
            "model": "gpt-3.5-turbo",
            "messages": [{"role": "user", "content": format!("Paraphrase this text: {}", req.text)}],
            "temperature": 0.7
        }))
        .send()
        .await {
            Ok(res) => res,
            Err(e) => {
                println!("Error contacting OpenAI: {}", e);
                return HttpResponse::InternalServerError().body("Failed to contact OpenAI");
            }
        };

    if !response.status().is_success() {
        let status = response.status();
        let error_text = response.text().await.unwrap_or_default();
        println!("OpenAI API error - Status: {}, Body: {}", status, error_text);
        return HttpResponse::InternalServerError().body("OpenAI API error");
    }

    let body: serde_json::Value = match response.json().await {
        Ok(b) => b,
        Err(e) => {
            println!("Error parsing OpenAI response: {}", e);
            return HttpResponse::InternalServerError().body("Invalid response from OpenAI");
        }
    };

    let paraphrased = body["choices"][0]["message"]["content"].as_str().unwrap_or("Error paraphrasing").to_string();
    println!("Paraphrased result: {}", paraphrased);

    HttpResponse::Ok().json(ParaphraseResponse { paraphrased })
}

#[actix_web::main]
async fn main() -> std::io::Result<()> {
    dotenv().ok();
    env_logger::init();

    println!("Starting server on http://127.0.0.1:8080");

    HttpServer::new(|| {
        let cors = Cors::default()
            .allow_any_origin()
            .allow_any_method()
            .allow_any_header();

        App::new()
            .wrap(cors)
            .wrap(Logger::default())
            .route("/paraphrase", web::post().to(paraphrase_handler))
    })
    .bind(("127.0.0.1", 8080))?
    .run()
    .await
}
