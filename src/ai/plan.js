import Anthropic from '@anthropic-ai/sdk'
import { zodToJsonSchema } from 'zod-to-json-schema'
import { House } from '../schema.js'
import { checkHouse } from '../standards.js'
import { getApiKey } from './apiKey.js'
import systemPrompt from './prompt.md?raw'

const MODEL_GENERATE = 'claude-opus-4-7'
const MODEL_EDIT = 'claude-sonnet-4-6'

const TOOL_NAME = 'emit_house_plan'

const tool = {
  name: TOOL_NAME,
  description: 'Emit a complete House plan object that conforms to the schema.',
  input_schema: zodToJsonSchema(House, { target: 'openApi3' }),
}

const client = () => {
  const apiKey = getApiKey()
  if (!apiKey) throw new Error('NO_API_KEY')
  return new Anthropic({ apiKey, dangerouslyAllowBrowser: true })
}

const extractPlan = (msg) => {
  const block = msg.content.find((b) => b.type === 'tool_use' && b.name === TOOL_NAME)
  if (!block) throw new Error('Model did not call emit_house_plan')
  return { block, plan: block.input }
}

export async function generatePlan(userPrompt, currentHouse = null) {
  const c = client()
  const model = currentHouse ? MODEL_EDIT : MODEL_GENERATE
  const userContent = currentHouse
    ? `Current plan:\n\`\`\`json\n${JSON.stringify(currentHouse, null, 2)}\n\`\`\`\n\nChanges:\n${userPrompt}`
    : userPrompt

  const messages = [{ role: 'user', content: userContent }]

  const first = await c.messages.create({
    model,
    max_tokens: 8192,
    system: [{ type: 'text', text: systemPrompt, cache_control: { type: 'ephemeral' } }],
    tools: [tool],
    tool_choice: { type: 'tool', name: TOOL_NAME },
    messages,
  })

  const { block, plan } = extractPlan(first)
  const validated = House.safeParse(plan)

  if (validated.success) {
    const issues = checkHouse(validated.data)
    return { house: validated.data, issues, raw: plan }
  }

  const errMsg = validated.error.issues
    .map((i) => `${i.path.join('.')}: ${i.message}`)
    .join('\n')
  const repair = await c.messages.create({
    model,
    max_tokens: 8192,
    system: [{ type: 'text', text: systemPrompt, cache_control: { type: 'ephemeral' } }],
    tools: [tool],
    tool_choice: { type: 'tool', name: TOOL_NAME },
    messages: [
      ...messages,
      { role: 'assistant', content: first.content },
      {
        role: 'user',
        content: [
          {
            type: 'tool_result',
            tool_use_id: block.id,
            is_error: true,
            content: `The emitted plan failed validation. Fix and re-emit:\n${errMsg}`,
          },
        ],
      },
    ],
  })

  const repaired = extractPlan(repair).plan
  const validated2 = House.parse(repaired)
  return { house: validated2, issues: checkHouse(validated2), raw: repaired }
}
