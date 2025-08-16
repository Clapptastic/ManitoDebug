
// Add global type definitions
interface Window {
  refreshApiStatus?: (apiType?: string) => Promise<void>;
}
