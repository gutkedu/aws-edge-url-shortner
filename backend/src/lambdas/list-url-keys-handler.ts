import { APIGatewayProxyHandler } from 'aws-lambda'
import { getLogger } from '@/shared/get-logger'
import { IntegrationError } from '@/shared/integration-error'
import { listUrlKeys } from '@/functions/list-url-keys'

const logger = getLogger()

export const listUrlKeysHandler: APIGatewayProxyHandler = async (event) => {
  logger.info('Received request to list URL keys', {
    queryParams: event.queryStringParameters
  })

  try {
    const { urlKeys, nextToken } = await listUrlKeys({
      token: event.queryStringParameters?.token || undefined
    })

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({
        urlKeys,
        nextToken
      })
    }
  } catch (error) {
    logger.error('Failed to list URL keys', { error })

    let statusCode = 500
    let errorMessage = 'Failed to list URL keys'

    if (error instanceof IntegrationError) {
      statusCode = 500
      errorMessage = error.message
    }

    return {
      statusCode,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({
        error: errorMessage,
        details: error instanceof Error ? error.message : 'Unknown error'
      })
    }
  }
}
