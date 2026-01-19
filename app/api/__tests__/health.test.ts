import { GET } from '../health/route'

describe('GET /api/health', () => {
    it('returns 200 with status ok', async () => {
        const response = await GET()

        expect(response.status).toBe(200)

        const data = await response.json()
        expect(data.status).toBe('ok')
        expect(data.timestamp).toBeDefined()
        expect(data.environment).toBe('test')
    })

    it('returns timestamp in ISO format', async () => {
        const response = await GET()
        const data = await response.json()

        expect(data.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T/)
    })
})
