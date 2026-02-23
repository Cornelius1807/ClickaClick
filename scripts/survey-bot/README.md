# Survey Bot — ClickaClick

Script Python para enviar respuestas automáticas al formulario final "Encuesta Sobre el Uso del Celular Final".

## Requisitos

- Python 3.10+
- Solo usa la librería `requests` (sin Selenium ni browser)

## Instalación

```bash
cd scripts/survey-bot
pip install -r requirements.txt
```

## Uso

### Paso 1: Verificar que detecta los campos del formulario

```bash
python discover_ids.py
```

Debería imprimir los entry IDs de cada pregunta.

### Paso 2: Hacer un dry-run (sin enviar nada)

```bash
python fill_survey.py --dry-run
```

### Paso 3: Enviar respuestas reales

```bash
# 110 respuestas con delay aleatorio de 3-8 segundos entre cada una
python fill_survey.py

# Especificar cantidad
python fill_survey.py --count 115

# Delay fijo (más rápido, mayor riesgo de rate limiting)
python fill_survey.py --count 110 --delay 2
```

## Distribuciones configuradas

| Pregunta | Distribución |
|---|---|
| Edad | Igual a encuesta inicial (70-74 mayoritario) |
| Celular | Igual a encuesta inicial (Android ~58%, iPhone ~39%) |
| Confianza tecnología | **Mejorada**: Confiado/Muy Confiado ~68% (antes ~20%) |
| Nivel de estrés | **Reducido**: Bajo/Medio ~90% (antes ~51%) |
| Para qué usó ClickaClick | Positivo: aprender, resolver, recordar |
| Después de usar ClickaClick | **Cambio**: 50% intenta primero con ClickaClick |
| Formato que ayudó | Video corto ~55%, Combinación ~22% |
| ¿Lo recomendaría? | Sí ~96% |
| Sugerencia de tema | Solo en ~15% de respuestas (texto libre) |

## Nota

Este script es solo para uso académico como parte del proyecto ClickaClick.
No afecta ningún archivo del proyecto principal.
