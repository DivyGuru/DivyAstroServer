# Layer Coverage Report: lalkitab

Generated: 2025-12-23T17:53:50.428Z

## Summary

- **Total meanings understood**: 235
- **Total rules created**: 235
- **Total skipped**: 0
- **Coverage**: 100%

## Layer Distribution

| Layer | Rules | Status |
|-------|-------|--------|
| BASE | 65 | ✅ Active |
| NAKSHATRA | 0 | ⚪ Empty |
| DASHA | 2 | ✅ Active |
| TRANSIT | 2 | ✅ Active |
| STRENGTH | 115 | ✅ Active |
| YOGA | 51 | ✅ Active |

## Notes

- Empty layers are VALID and expected
- System gracefully handles missing layers
- Modifier layers (STRENGTH/YOGA) may require base_rule_ids during ingestion
- Engine status: READY = executable, PENDING_OPERATOR = needs enhancement

## Files Generated

- `datasets/rules.v1.json` - Unified rules dataset
- `datasets/rules.*.v1.json` - Layer-specific datasets
- `conversion_skipped.v1.json` - Skipped items with reasons
