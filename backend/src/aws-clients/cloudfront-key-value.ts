import { CloudFrontKeyValueStoreClient } from '@aws-sdk/client-cloudfront-keyvaluestore'
import '@aws-sdk/signature-v4-crt'

let client: CloudFrontKeyValueStoreClient | null = null

export const cloudFrontKeyValue = (): CloudFrontKeyValueStoreClient => {
  if (client) {
    return client
  }
  client = new CloudFrontKeyValueStoreClient({
    region: process.env.AWS_REGION || 'us-east-1'
  })
  return client
}
