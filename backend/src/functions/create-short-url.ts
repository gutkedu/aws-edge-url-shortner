import { cloudFrontKeyValue } from '@/aws-clients/cloudfront-key-value'
import { getLogger } from '@/shared/get-logger'
import { IntegrationError } from '@/shared/integration-error'
import { DescribeKeyValueStoreCommand, ListKeysCommand, PutKeyCommand } from '@aws-sdk/client-cloudfront-keyvaluestore'
import { randomUUID } from 'crypto'

interface Input {
  originalUrl: string
}

interface Output {
  shortId: string
  shortUrl: string
}

const cloudfrontKeyValueClient = cloudFrontKeyValue()
const logger = getLogger()

export async function createShortUrl({ originalUrl }: Input): Promise<Output> {
  const SHORT_ID_LENGTH = 6

  logger.info('Processing request to create short URL', { originalUrl })

  try {
    const describeCommand = new DescribeKeyValueStoreCommand({
      KvsARN: process.env.KEY_VALUE_STORE_ARN
    })

    const kvStore = await cloudfrontKeyValueClient.send(describeCommand)

    logger.info('kvStore', { kvStore })

    if (!kvStore.ETag) {
      throw new IntegrationError('Failed to get ETag from KeyValueStore')
    }

    const getAllKvsCommand = new ListKeysCommand({
      KvsARN: process.env.KEY_VALUE_STORE_ARN
    })

    const allKeys = await cloudfrontKeyValueClient.send(getAllKvsCommand)

    logger.info('allKeys', { allKeys })

    const existingEntry = allKeys.Items?.find((item) => item.Value === originalUrl)
    if (existingEntry && existingEntry.Key) {
      const shortId = existingEntry.Key
      const shortUrl = `https://${process.env.CLOUDFRONT_DOMAIN_NAME}/${shortId}`

      logger.info('URL already exists, returning existing short URL', {
        shortId,
        shortUrl,
        originalUrl
      })

      return { shortId, shortUrl }
    }

    if (allKeys.Items && allKeys.Items.length >= 50) {
      throw new IntegrationError('The maximum number of short URLs has been reached')
    }

    const shortId = randomUUID().substring(0, SHORT_ID_LENGTH)

    const command = new PutKeyCommand({
      IfMatch: kvStore.ETag,
      Key: shortId,
      KvsARN: process.env.KEY_VALUE_STORE_ARN,
      Value: originalUrl
    })

    await cloudfrontKeyValueClient.send(command)

    const shortUrl = `https://${process.env.CLOUDFRONT_DOMAIN_NAME}/${shortId}`

    logger.info('Short URL created', { shortId, shortUrl, originalUrl })

    return { shortId, shortUrl }
  } catch (error) {
    logger.error('Failed to create short URL', { error })
    throw new IntegrationError('Failed to create short URL')
  }
}
