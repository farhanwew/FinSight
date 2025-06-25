# app/services/llm_service.py
import httpx
import json
from fastapi import HTTPException
from app.config import OPENROUTER_API_KEY, OPENROUTER_API_URL, MODEL_NAME
from typing import List, Dict, Any, Optional

async def get_business_recommendations_from_llm(modal: float, minat: Optional[str], lokasi: Optional[str]) -> List[Dict[str, Any]]:
    prompt_parts = [
        f"Berikan 3 rekomendasi usaha UMKM berdasarkan kriteria berikut:",
        f"- Modal tersedia: Rp {modal:,.0f}",
    ]
    if minat:
        prompt_parts.append(f"- Minat bidang usaha: {minat}")
    if lokasi:
        prompt_parts.append(f"- Target lokasi: {lokasi}")
    
    prompt_parts.append("\nFormat jawaban dalam bentuk JSON object dengan kunci 'recommendations' yang berisi array, di mana setiap objek memiliki kunci: 'nama' (string), 'deskripsi' (string), 'modal_dibutuhkan' (integer), 'potensi_keuntungan' (string, misal 'Rp X - Y/bulan'), dan 'tingkat_risiko' (string, 'Rendah', 'Sedang', atau 'Tinggi').")
    prompt_parts.append("Contoh format JSON yang diharapkan: {\"recommendations\": [{\"nama\": \"Warung Kopi Sederhana\", \"deskripsi\": \"Warung kopi dengan menu terbatas namun berkualitas\", \"modal_dibutuhkan\": 800000, \"potensi_keuntungan\": \"Rp 300k - 500k/bulan\", \"tingkat_risiko\": \"Rendah\"}]}")

    full_prompt = "\n".join(prompt_parts)

    if not OPENROUTER_API_KEY:
        raise HTTPException(status_code=500, detail="API Key untuk layanan rekomendasi tidak dikonfigurasi.")

    try:
        async with httpx.AsyncClient() as client:
            api_response = await client.post(
                OPENROUTER_API_URL,
                headers={
                    "Authorization": f"Bearer {OPENROUTER_API_KEY}",
                    "Content-Type": "application/json",
                },
                json={
                    "model": f"{MODEL_NAME}", 
                    "messages": [
                        {"role": "user", "content": full_prompt}
                    ],
                    "response_format": {"type": "json_object"}
                },
                timeout=30.0
            )
            api_response.raise_for_status()
            
            response_data = api_response.json()
            
            if response_data.get("choices") and len(response_data["choices"]) > 0:
                content_str = response_data["choices"][0].get("message", {}).get("content")
                if content_str:
                    try:
                        parsed_content = json.loads(content_str)
                        if isinstance(parsed_content, dict) and "recommendations" in parsed_content:
                             return parsed_content["recommendations"]
                        elif isinstance(parsed_content, dict) and "usaha" in parsed_content:
                             return parsed_content["usaha"]
                        elif isinstance(parsed_content, list) :
                            return parsed_content
                        else:
                            print(f"Warning: LLM JSON format not as expected: {content_str}")
                            return [{"nama": "Gagal memproses rekomendasi dari AI", "deskripsi": "Silakan coba lagi atau periksa konfigurasi.", "modal_dibutuhkan": 0, "potensi_keuntungan": "-", "tingkat_risiko": "-"}]
                    except Exception as e:
                        print(f"Error parsing recommendations from LLM: {e}, content: {content_str}")
                        raise HTTPException(status_code=500, detail=f"Error parsing AI recommendation: {str(e)}")
                else:
                    return [{"nama": "Tidak ada konten dari AI", "deskripsi": "-", "modal_dibutuhkan": 0, "potensi_keuntungan": "-", "tingkat_risiko": "-"}]
            else:
                 return [{"nama": "Tidak ada respons dari AI", "deskripsi": "-", "modal_dibutuhkan": 0, "potensi_keuntungan": "-", "tingkat_risiko": "-"}]

    except httpx.HTTPStatusError as e:
        print(f"HTTP error occurred: {e.response.status_code} - {e.response.text}")
        raise HTTPException(status_code=e.response.status_code, detail=f"Gagal menghubungi layanan rekomendasi: {e.response.text}")
    except httpx.RequestError as e:
        print(f"Request error occurred: {e}")
        raise HTTPException(status_code=503, detail=f"Layanan rekomendasi tidak tersedia: {e}")
    except Exception as e:
        print(f"An unexpected error occurred: {e}")
        raise HTTPException(status_code=500, detail=f"Terjadi kesalahan internal saat memproses rekomendasi: {str(e)}")


async def get_llm_insight(prompt: str) -> str:
    """
    Fungsi untuk mendapatkan insight atau teks dari LLM berdasarkan prompt.
    """
    if not OPENROUTER_API_KEY:
        raise HTTPException(status_code=500, detail="API Key untuk layanan AI tidak dikonfigurasi.")

    try:
        async with httpx.AsyncClient() as client:
            api_response = await client.post(
                OPENROUTER_API_URL,
                headers={
                    "Authorization": f"Bearer {OPENROUTER_API_KEY}",
                    "Content-Type": "application/json",
                },
                json={
                    "model": MODEL_NAME, 
                    "messages": [
                        {"role": "user", "content": prompt}
                    ],
                    # Untuk insight sederhana, kita tidak perlu response_format: {"type": "json_object"}
                    # Cukup biarkan LLM mengembalikan string teks biasa.
                },
                timeout=30.0
            )
            api_response.raise_for_status()
            
            response_data = api_response.json()
            
            if response_data.get("choices") and len(response_data["choices"]) > 0:
                content_str = response_data["choices"][0].get("message", {}).get("content")
                return content_str if content_str else "Tidak ada insight yang dihasilkan oleh AI."
            else:
                return "Tidak ada respons yang valid dari AI."

    except httpx.HTTPStatusError as e:
        print(f"HTTP error occurred in get_llm_insight: {e.response.status_code} - {e.response.text}")
        raise HTTPException(status_code=e.response.status_code, detail=f"Gagal menghubungi layanan AI untuk insight: {e.response.text}")
    except httpx.RequestError as e:
        print(f"Request error occurred in get_llm_insight: {e}")
        raise HTTPException(status_code=503, detail=f"Layanan AI untuk insight tidak tersedia: {e}")
    except Exception as e:
        print(f"An unexpected error occurred in get_llm_insight: {e}")
        raise HTTPException(status_code=500, detail=f"Terjadi kesalahan internal saat memproses insight: {str(e)}")

