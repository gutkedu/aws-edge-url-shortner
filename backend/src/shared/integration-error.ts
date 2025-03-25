/** Custom error class for integrations; 
 This error should be used when an integration fails, for example aws services, external apis, etc.
 */
export class IntegrationError {
  message: string
  options?: { [key: string]: string | string[] | number | boolean }
  isIntegrationError = true

  constructor(message: string, options?: { [key: string]: string | number | boolean }) {
    this.message = message
    this.options = options
  }
}
