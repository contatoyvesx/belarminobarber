# Testes Manuais de Agenda

Use estas chamadas para validar rapidamente as rotas durante o desenvolvimento local (o servidor padrão roda em http://localhost:3000/).

## Horários disponíveis

```bash
curl "http://localhost:3000/horarios?data=2025-11-18&barbeiro_id=00000000-0000-0000-0000-000000000000"
```

## Criar agendamento

```bash
curl -X POST "http://localhost:3000/agendar" \
  -H "Content-Type: application/json" \
  -d '{
    "cliente": "Cliente Exemplo",
    "telefone": "+55 11 99999-9999",
    "servico": "Corte",
    "data": "2025-11-18",
    "hora": "10:00",
    "barbeiro_id": "00000000-0000-0000-0000-000000000000"
  }'
```
