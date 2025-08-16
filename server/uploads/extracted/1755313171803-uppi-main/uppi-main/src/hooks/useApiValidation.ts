
import { ApiKeyType, ApiKeyTypeEnum } from "@/types/api-keys/unified";
import { supabase } from "@/integrations/supabase/client";

export const useApiValidation = () => {
  /**
   * Validates an API key against the specified provider
   * @param keyType The type of API key to validate
   * @param apiKey The API key to validate
   * @returns Boolean indicating if the key is valid
   */
  const validateApiKey = async (keyType: ApiKeyType, apiKey: string): Promise<boolean> => {
    try {
      const { data, error } = await supabase.functions.invoke("validate-api-key", {
        body: {
          provider: keyType,
          api_key: apiKey
        }
      });

      if (error) {
        console.error("Error validating API key:", error);
        return false;
      }

      return data?.isValid || false;
    } catch (error) {
      console.error("Error calling validate-api-key function:", error);
      return false;
    }
  };

  return {
    validateApiKey
  };
};
