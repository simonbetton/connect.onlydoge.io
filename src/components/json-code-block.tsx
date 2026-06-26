import {
  CodeBlock,
  CodeBlockBody,
  CodeBlockContent,
  CodeBlockCopyButton,
  CodeBlockFilename,
  CodeBlockHeader,
  CodeBlockItem,
} from "@/components/kibo-ui/code-block"

type JsonCodeBlockProps = {
  filename: string
  value: string
}

export const JsonCodeBlock = ({ filename, value }: JsonCodeBlockProps) => (
  <CodeBlock
    data={[
      {
        code: value,
        filename,
        language: "json",
      },
    ]}
    defaultValue="json"
    className="min-w-0"
  >
    <CodeBlockHeader>
      <CodeBlockFilename value="json">{filename}</CodeBlockFilename>
      <CodeBlockCopyButton />
    </CodeBlockHeader>
    <CodeBlockBody>
      <CodeBlockItem
        value="json"
        lineNumbers={false}
        className="[&_.line]:whitespace-pre-wrap [&_.line]:break-all [&_code]:whitespace-pre-wrap [&_code]:break-words [&_pre]:overflow-x-hidden [&_pre]:whitespace-pre-wrap [&_pre]:break-words"
      >
        <CodeBlockContent
          language="json"
          className="[&_.line]:whitespace-pre-wrap [&_.line]:break-all [&_code]:whitespace-pre-wrap [&_code]:break-words [&_pre]:overflow-x-hidden [&_pre]:whitespace-pre-wrap [&_pre]:break-words"
        >
          {value}
        </CodeBlockContent>
      </CodeBlockItem>
    </CodeBlockBody>
  </CodeBlock>
)
