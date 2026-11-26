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
        className="[&_.line]:break-all [&_.line]:whitespace-pre-wrap [&_code]:wrap-break-word [&_code]:whitespace-pre-wrap [&_pre]:overflow-x-hidden [&_pre]:wrap-break-word [&_pre]:whitespace-pre-wrap"
      >
        <CodeBlockContent
          language="json"
          className="[&_.line]:break-all [&_.line]:whitespace-pre-wrap [&_code]:wrap-break-word [&_code]:whitespace-pre-wrap [&_pre]:overflow-x-hidden [&_pre]:wrap-break-word [&_pre]:whitespace-pre-wrap"
        >
          {value}
        </CodeBlockContent>
      </CodeBlockItem>
    </CodeBlockBody>
  </CodeBlock>
)
