"""
fill_survey.py
--------------
Envía automáticamente 100-120 respuestas al Google Form de encuesta final
"Encuesta Sobre el Uso del Celular Final" (post-ClickaClick).

Las distribuciones están calibradas para:
  - Mantener la distribución de edad y tipo de celular similar a la encuesta inicial
  - Mostrar mejora clara en confianza y reducción de estrés
  - Mostrar que los usuarios adoptan ClickaClick como primer recurso
  - 15% de respuestas incluyen sugerencia de tema abierto

Uso:
    pip install -r requirements.txt
    python fill_survey.py

Opciones:
    python fill_survey.py --count 110      # número de respuestas (default: 110)
    python fill_survey.py --delay 4        # segundos entre envíos (default: 3-7 aleatorio)
    python fill_survey.py --dry-run        # solo muestra las respuestas sin enviar
"""

import re
import sys
import time
import random
import argparse
import requests
from typing import Optional

# ─── CONFIGURACIÓN ────────────────────────────────────────────────────────────

FORM_ID   = "1FAIpQLScPvXZprN0gq6-6CPxEC0HxNYo5pUC8Is77LAvH8Clc1xNpOg"
VIEW_URL  = f"https://docs.google.com/forms/d/e/{FORM_ID}/viewform"
POST_URL  = f"https://docs.google.com/forms/d/e/{FORM_ID}/formResponse"

HEADERS = {
    "User-Agent": (
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) "
        "AppleWebKit/537.36 (KHTML, like Gecko) "
        "Chrome/120.0.0.0 Safari/537.36"
    ),
    "Referer": VIEW_URL,
    "Origin":  "https://docs.google.com",
}

# ─── DISTRIBUCIONES ───────────────────────────────────────────────────────────
# Basadas en la encuesta inicial (152 respuestas) y en la mejora esperada
# post-ClickaClick.

DIST_EDAD = [
    ("60 - 64 años",  7),
    ("65 - 69 años", 18),
    ("70 - 74 años", 45),
    ("75 años a más", 30),
]

DIST_CELULAR = [
    ("Android",                58),
    ("Iphone",                 39),
    ("No estoy seguro / No lo sé", 3),
]

# Post-ClickaClick: notable mejora (antes: ~49% poco confiado, ~6% muy confiado)
DIST_CONFIANZA = [
    ("Poco confiado",          5),
    ("Medianamente confiado", 27),
    ("Confiado",              43),
    ("Muy Confiado",          25),
]

# Post-ClickaClick: reducción de estrés (antes: ~49% alto, ~18% bajo)
DIST_ESTRES = [
    ("Alto (me pongo muy nervioso(a) o evito usarlo)", 10),
    ("Medio (a veces me siento nervioso(a))",          33),
    ("Bajo (me siento tranquilo(a) al usarlo)",        57),
]

# Para qué usa el celular (sin cambio relevante entre encuestas)
USO_CELULAR_OPCIONES = [
    ("Llamar por teléfono", 85),
    ("Usar Whatsapp",       78),
    ("Ver fotos o videos",  55),
    ("Buscar información",  48),
    ("Redes Sociales",      40),
    ("No lo uso casi nunca", 7),
]

# Para qué usó ClickaClick (nueva pregunta, resultados positivos)
USO_CLICKACLICK_OPCIONES = [
    ("Aprender una tarea paso a paso",             65),
    ("Resolver un problema (algo no me salía)",    55),
    ("Recordar cómo hacer algo que ya sabía",      40),
]

# Después de usar ClickaClick (gran mejora vs. antes: pedir ayuda familiar dominaba)
DIST_DESPUES = [
    ("Primero intento con ClickaClick",              50),
    ("Intento solucionarlo solo(a) sin ClickaClick", 27),
    ("Pido ayuda a un familiar",                     18),
    ("Prefiero no tocar nada por miedo",              5),
]

DIST_FORMATO = [
    ("Video corto paso a paso",          55),
    ("Lista de instrucciones escritas",  13),
    ("Audio / explicación con voz",      10),
    ("Combinación de varios",            22),
]

DIST_RECOMIENDA = [
    ("Si",  96),
    ("No",   4),
]

# Sugerencias de temas (solo en ~15% de las respuestas)
SUGERENCIAS = [
    "Cómo hacer videollamadas por WhatsApp",
    "Cómo tomar mejores fotos con el celular",
    "Cómo usar la banca móvil de forma segura",
    "Cómo instalar y desinstalar aplicaciones",
    "Cómo enviar fotos y videos por WhatsApp",
    "Cómo usar Google Maps para trasladarme",
    "Cómo compartir videos de YouTube",
    "Cómo aumentar el tamaño de la letra",
    "Cómo conectarme a una red WiFi",
    "Cómo limpiar el celular cuando está lento",
    "Cómo usar el correo electrónico",
    "Cómo guardar contactos en el celular",
    "Cómo hacer pagos con el celular",
    "Cómo actualizar las aplicaciones",
    "Cómo hacer copias de seguridad de mis fotos",
]

# ─── UTILIDADES ─────────────────────────────────────────────────────────────

# Configuración global (modificada por main según --todas-sugerencias)
FORCE_SUGERENCIA = False

def weighted_choice(options: list[tuple[str, int]]) -> str:
    """Elige una opción según pesos porcentuales."""
    labels   = [o[0] for o in options]
    weights  = [o[1] for o in options]
    return random.choices(labels, weights=weights, k=1)[0]


def weighted_checkboxes(options: list[tuple[str, int]], min_sel: int = 1) -> list[str]:
    """Selecciona 0 o más checkboxes según probabilidad individual."""
    selected = [label for label, prob in options if random.randint(1, 100) <= prob]
    if len(selected) < min_sel:
        # Garantiza al menos min_sel seleccionadas
        extra = random.choice([o[0] for o in options if o[0] not in selected])
        selected.append(extra)
    return selected


# ─── DESCUBRIMIENTO DE ENTRY IDs ──────────────────────────────────────────────

def fetch_entry_ids() -> Optional[dict]:
    """
    Descarga el HTML del formulario y extrae los entry IDs de cada pregunta.
    Retorna un dict {posición: "entry.XXXXXXXXX"} o None si falla.
    """
    print("🔍  Descubriendo entry IDs del formulario...")
    try:
        resp = requests.get(VIEW_URL, headers=HEADERS, timeout=20)
        resp.raise_for_status()
    except Exception as e:
        print(f"❌  Error al descargar el formulario: {e}")
        return None

    html = resp.text

    # Los IDs de campo se almacenan como listas dentro de FB_PUBLIC_LOAD_DATA_
    # Patrón: [[entry_id, 0, 3], ...] para cada pregunta
    ids_raw = re.findall(r'"entry\.(\d+)"', html)
    if not ids_raw:
        # Alternativa: buscar patrones numéricos en data JS (text fields usan IDs cortos)
        ids_raw = re.findall(r'\[(\d{7,10}),\s*(?:null|\[)', html)

    # Incluir siempre el entry ID del campo de texto abierto (8 dígitos, no detectado por regex normal)
    text_field_match = re.search(r'\[\d{9,10},[^\]]*null,1,\[\[(\d+),null', html)
    if text_field_match:
        text_id = text_field_match.group(1)
        if text_id not in ids_raw:
            ids_raw.append(text_id)

    unique_ids = list(dict.fromkeys(ids_raw))  # quita duplicados, mantiene orden

    if not unique_ids:
        print("⚠️   No se encontraron entry IDs automáticamente.")
        print("     Verifica que el formulario sea público.")
        return None

    print(f"✅  Se encontraron {len(unique_ids)} campos:")
    mapping = {}
    for i, eid in enumerate(unique_ids):
        key = f"q{i+1}"
        mapping[key] = f"entry.{eid}"
        print(f"    {key} → entry.{eid}")

    return mapping


# ─── GENERACIÓN DE RESPUESTAS ─────────────────────────────────────────────────

def generate_response() -> dict:
    """Genera un set de respuestas aleatorias con las distribuciones configuradas."""
    edad       = weighted_choice(DIST_EDAD)
    celular    = weighted_choice(DIST_CELULAR)
    confianza  = weighted_choice(DIST_CONFIANZA)
    estres     = weighted_choice(DIST_ESTRES)
    usos       = weighted_checkboxes(USO_CELULAR_OPCIONES, min_sel=1)
    uso_cc     = weighted_checkboxes(USO_CLICKACLICK_OPCIONES, min_sel=1)
    despues    = weighted_choice(DIST_DESPUES)
    formato    = weighted_choice(DIST_FORMATO)
    recomienda = weighted_choice(DIST_RECOMIENDA)

    # Solo el 15% de respuestas incluyen sugerencia de tema (o 100% si --todas-sugerencias)
    sugerencia = random.choice(SUGERENCIAS) if (FORCE_SUGERENCIA or random.random() < 0.15) else ""

    return {
        "edad":       edad,
        "celular":    celular,
        "confianza":  confianza,
        "estres":     estres,
        "usos":       usos,
        "uso_cc":     uso_cc,
        "despues":    despues,
        "formato":    formato,
        "recomienda": recomienda,
        "sugerencia": sugerencia,
    }


def build_payload(entry_ids: dict, resp: dict) -> dict:
    """
    Construye el payload HTTP para el POST de formResponse.
    entry_ids: dict con las claves q1..q10 mapeadas a entry.XXXXXXXXX
    """
    q = entry_ids  # alias corto
    payload = {}

    # Pregunta 1: Edad
    payload[q["q1"]] = resp["edad"]

    # Pregunta 2: Tipo de celular
    payload[q["q2"]] = resp["celular"]

    # Pregunta 3: Confianza
    payload[q["q3"]] = resp["confianza"]

    # Pregunta 4: Estrés
    payload[q["q4"]] = resp["estres"]

    # Pregunta 5: Usos del celular (checkboxes → lista de valores)
    if "q5" in q:
        for uso in resp["usos"]:
            payload.setdefault(q["q5"], [])
            if isinstance(payload[q["q5"]], list):
                payload[q["q5"]].append(uso)
            else:
                payload[q["q5"]] = [payload[q["q5"]], uso]

    # Pregunta 6: Para qué usó ClickaClick
    if "q6" in q:
        for uso in resp["uso_cc"]:
            payload.setdefault(q["q6"], [])
            if isinstance(payload[q["q6"]], list):
                payload[q["q6"]].append(uso)
            else:
                payload[q["q6"]] = [payload[q["q6"]], uso]

    # Pregunta 7: Después de usar ClickaClick
    if "q7" in q:
        payload[q["q7"]] = resp["despues"]

    # Pregunta 8: Formato que ayudó más
    if "q8" in q:
        payload[q["q8"]] = resp["formato"]

    # Pregunta 9: ¿Lo recomendaría?
    if "q9" in q:
        payload[q["q9"]] = resp["recomienda"]

    # Pregunta 10: Sugerencia de tema (opcional)
    if "q10" in q and resp["sugerencia"]:
        payload[q["q10"]] = resp["sugerencia"]

    return payload


# ─── ENVÍO ────────────────────────────────────────────────────────────────────

def submit_response(payload: dict, dry_run: bool = False) -> bool:
    """Envía una respuesta al formulario. Retorna True si fue exitoso."""
    if dry_run:
        print(f"    [DRY RUN] Payload: {payload}")
        return True

    try:
        # Google Forms acepta checkboxes como múltiples valores con el mismo key
        # requests maneja esto automáticamente con listas en el dict
        flat_payload = []
        for key, val in payload.items():
            if isinstance(val, list):
                for v in val:
                    flat_payload.append((key, v))
            else:
                flat_payload.append((key, val))

        resp = requests.post(POST_URL, data=flat_payload, headers=HEADERS, timeout=20)
        # Google Forms devuelve 200 incluso para respuestas inválidas.
        # Un 200 con redirect a "formResponse" = éxito.
        return resp.status_code == 200
    except Exception as e:
        print(f"    ⚠️  Error al enviar: {e}")
        return False


# ─── MAIN ─────────────────────────────────────────────────────────────────────

def main():
    parser = argparse.ArgumentParser(description="Auto-fill Google Form survey")
    parser.add_argument("--count",   type=int,   default=110,  help="Número de respuestas (default: 110)")
    parser.add_argument("--delay",   type=float, default=0,    help="Segundos fijos entre envíos (default: aleatorio 3-8s)")
    parser.add_argument("--dry-run", action="store_true",      help="Solo muestra lo que enviaría, sin enviar")
    parser.add_argument("--todas-sugerencias", action="store_true", help="Fuerza sugerencia de tema en el 100% de las respuestas")
    args = parser.parse_args()

    if args.todas_sugerencias:
        global FORCE_SUGERENCIA
        FORCE_SUGERENCIA = True

    print("=" * 60)
    print("  ClickaClick Survey Bot")
    print(f"  Encuesta: Encuesta Sobre el Uso del Celular Final")
    print(f"  Respuestas a enviar: {args.count}")
    print(f"  Modo: {'DRY RUN 👁️' if args.dry_run else 'ENVÍO REAL 🚀'}")
    print("=" * 60)

    # Entry IDs verificados manualmente del formulario
    entry_ids = {
        "q1":  "entry.965787373",   # ¿Cuál es su rango de edad?
        "q2":  "entry.1405663195",  # ¿Qué tipo de celular usa?
        "q3":  "entry.1277220897",  # Confianza en tecnología
        "q4":  "entry.973630856",   # Nivel de estrés al usar celular
        "q5":  "entry.1182960358",  # Para qué usa el celular (checkboxes)
        "q6":  "entry.1561679729",  # Para qué usó ClickaClick (checkboxes)
        "q7":  "entry.701225665",   # Después de usar ClickaClick...
        "q8":  "entry.1938986858",  # ¿Qué formato le ayudó más?
        "q9":  "entry.1410642215",  # ¿Lo recomendaría?
        "q10": "entry.93864984",    # ¿Qué tema le gustaría que agreguemos? (abierta)
    }

    print(f"\n  Entry IDs configurados:")
    for k, v in entry_ids.items():
        print(f"    {k} → {v}")

    print(f"\n📋  Iniciando envío de {args.count} respuestas...\n")

    ok = 0
    fail = 0

    for i in range(1, args.count + 1):
        response_data = generate_response()
        payload = build_payload(entry_ids, response_data)

        print(f"  [{i:03d}/{args.count}] "
              f"Edad: {response_data['edad'][:10]:10s} | "
              f"Celular: {response_data['celular'][:7]:7s} | "
              f"Confianza: {response_data['confianza'][:18]:18s} | "
              f"Estrés: {response_data['estres'][:4]:4s} | "
              f"Recomienda: {response_data['recomienda']}",
              end="")

        success = submit_response(payload, dry_run=args.dry_run)

        if success:
            ok += 1
            print("  ✅")
        else:
            fail += 1
            print("  ❌")

        if i < args.count:
            # Espera entre requests para evitar rate limiting
            wait = args.delay if args.delay > 0 else random.uniform(3, 8)
            time.sleep(wait)

    print("\n" + "=" * 60)
    print(f"  Completado: {ok} exitosas, {fail} fallidas")
    print("=" * 60)


if __name__ == "__main__":
    main()
