
import { supabase } from "@/integrations/supabase/client";

const MAX_RETRIES = 3;
const RETRY_DELAY = 2000; // 2 seconds

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Validate competitor name format
 */
export function validateCompetitorName(competitor: string): void {
  if (!competitor || typeof competitor !== 'string') {
    console.error("Invalid competitor name provided:", competitor);
    throw new Error('Competitor name must be a non-empty string');
  }

  const nameValidation = /^[\w\s&.-]{2,100}$/;
  if (!nameValidation.test(competitor)) {
    throw new Error('Company name contains invalid characters or is too long/short');
  }
}

/**
 * Verify that the company exists
 */
export async function verifyCompanyExistence(competitor: string, userId: string): Promise<any> {
  let retryCount = 0;
  
  while (retryCount < MAX_RETRIES) {
    const { data: verification, error: verificationError } = await supabase.functions.invoke('verify-company', {
      body: { 
        companyName: competitor,
        userId: userId
      }
    });

    if (!verificationError && verification?.exists) {
      return verification;
    }

    retryCount++;
    if (retryCount < MAX_RETRIES) {
      console.log(`Retrying company verification (attempt ${retryCount + 1})`);
      await sleep(RETRY_DELAY);
    }
  }

  throw new Error('Could not verify company existence. Please check the company name.');
}

/**
 * Calculate market size for the company's industry
 */
export async function calculateMarketSize(competitor: string, userId: string): Promise<any> {
  let retryCount = 0;
  
  while (retryCount < MAX_RETRIES) {
    // TODO: Function 'calculate-market-size' does not exist - fix or implement
    // const { data: sizeData, error: marketSizeError } = await supabase.functions.invoke('calculate-market-size', {
    //   body: { 
    //     company: competitor,
    //     userId: userId,
    //     attempt: retryCount + 1
    //   }
    // });
    const sizeData = null, marketSizeError = new Error('calculate-market-size function does not exist');

    if (!marketSizeError && sizeData) {
      // Validate market size data ranges
      if (sizeData?.data) {
        const { totalMarketSize, growthRate } = sizeData.data;
        if (totalMarketSize < 0 || growthRate < -100 || growthRate > 1000) {
          console.warn('Market size data outside expected ranges:', sizeData.data);
          retryCount++;
          continue;
        }
      }
      
      return sizeData;
    }

    retryCount++;
    if (retryCount < MAX_RETRIES) {
      console.log(`Retrying market size calculation (attempt ${retryCount + 1})`);
      await sleep(RETRY_DELAY);
    }
  }
  
  console.warn('Could not calculate market size after maximum retries');
  return null;
}
