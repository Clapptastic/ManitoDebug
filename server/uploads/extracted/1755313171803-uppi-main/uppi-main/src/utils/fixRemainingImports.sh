#!/bin/bash
# Quick script to fix remaining import errors

files=(
  "src/hooks/useApiKeyModelManagement.ts"
  "src/hooks/useApiManagement.ts" 
  "src/hooks/useApiStatus.ts"
  "src/hooks/useApiStatuses.ts"
  "src/hooks/useMicroservices.ts"
  "src/hooks/useModelListState.ts"
  "src/services/api-keys/ApiKeyModelManagementService.ts"
)

for file in "${files[@]}"; do
  if [ -f "$file" ]; then
    sed -i "s|'@/types/api-keys/types'|'@/types/api-keys/unified'|g" "$file"
    echo "Fixed imports in $file"
  fi
done