import { Box, Select } from "@mantine/core";
import { Editor } from "@monaco-editor/react";

const languages = ['Python', 'Javascript', 'C++'];

function CodeEditorWithLanguageSelector({ language, code, onCodeChange, onLanguageChange, label, required }) {
  return (
    <Box>
      <Select
        label={`${label}`}
        placeholder="Select a language"
        data={languages}
        value={language}
        onChange={onLanguageChange}
        mb={8}
        required={required}
      />
      <Editor
        height="300px"
        language={language.toLowerCase()}
        value={code}
        theme="vs-dark"
        onChange={(value) => onCodeChange(value || '')}
        options={{padding: {top: 12}}}
      />
    </Box>
  );
}

export default CodeEditorWithLanguageSelector;
