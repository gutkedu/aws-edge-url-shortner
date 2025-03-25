import { cloudFrontKeyValue } from '@/aws-clients/cloudfront-key-value'
import { getLogger } from '@/shared/get-logger'
import { IntegrationError } from '@/shared/integration-error'
import { ListKeysCommand } from '@aws-sdk/client-cloudfront-keyvaluestore'

interface ListKeysInput {
  token?: string
}

interface ListKeysOutput {
  urlKeys: Record<string, string>[]
  nextToken: string | null
}

const cloudfrontKeyValueClient = cloudFrontKeyValue()
const logger = getLogger()

export async function listUrlKeys({ token }: ListKeysInput): Promise<ListKeysOutput> {
  try {
    const getAllKvsCommand = new ListKeysCommand({
      KvsARN: process.env.KEY_VALUE_STORE_ARN,
      MaxResults: 10,
      NextToken: token
    })

    const allKeys = await cloudfrontKeyValueClient.send(getAllKvsCommand)

    logger.info('allKeys', { allKeys })

    if (!allKeys.Items) {
      return { urlKeys: [], nextToken: null }
    }

    return {
      urlKeys: allKeys.Items.filter((item) => item.Value !== undefined).map((item) => ({
        [String(item.Key)]: item.Value as string
      })),
      nextToken: allKeys.NextToken ?? null
    }
  } catch (error) {
    logger.error('Failed to list keys', { error })
    throw new IntegrationError('Failed to list keys')
  }
}
