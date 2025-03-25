import { APIGatewayProxyHandler } from 'aws-lambda'
import { z } from 'zod'
import { getLogger } from '@/shared/get-logger'
import { createShortUrl } from '@/functions/create-short-url'
import { IntegrationError } from '@/shared/integration-error'

const logger = getLogger()

export const createUrlHandler: APIGatewayProxyHandler = async (event) => {
  logger.info('Received request to create short URL', { event })

  try {
    const schema = z.object({
      url: z.string().url()
    })

    const requestBody = JSON.parse(event.body ?? '{}')

    const { url } = schema.parse(requestBody)

    const { shortId, shortUrl } = await createShortUrl({ originalUrl: url })

    return {
      statusCode: 201,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({
        shortId,
        shortUrl
      })
    }
  } catch (error) {
    logger.error('Failed to create short URL', { error })

    let statusCode = 500
    let errorMessage = 'Failed to create short URL'

    if (error instanceof z.ZodError) {
      statusCode = 400
      errorMessage = 'Invalid URL provided'
    }

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
