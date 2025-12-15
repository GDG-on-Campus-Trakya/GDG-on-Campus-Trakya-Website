"use client";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeSanitize from "rehype-sanitize";

const MarkdownRenderer = ({ content, className = "" }) => {
  const components = {
    h1: ({ node, ...props }) => (
      <h1 className="text-3xl font-bold mt-6 mb-4 bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent" {...props} />
    ),
    h2: ({ node, ...props }) => (
      <h2 className="text-2xl font-bold mt-5 mb-3 text-white" {...props} />
    ),
    h3: ({ node, ...props }) => (
      <h3 className="text-xl font-semibold mt-4 mb-2 text-gray-200" {...props} />
    ),
    h4: ({ node, ...props }) => (
      <h4 className="text-lg font-semibold mt-3 mb-2 text-gray-300" {...props} />
    ),
    h5: ({ node, ...props }) => (
      <h5 className="font-semibold mt-2 mb-1 text-gray-300" {...props} />
    ),
    h6: ({ node, ...props }) => (
      <h6 className="font-semibold text-sm text-gray-400" {...props} />
    ),
    p: ({ node, ...props }) => (
      <p className="text-gray-300 mb-4 leading-relaxed" {...props} />
    ),
    a: ({ node, ...props }) => (
      <a
        {...props}
        target="_blank"
        rel="noopener noreferrer"
        className="text-blue-400 hover:text-blue-300 underline underline-offset-2 transition-colors duration-200"
      />
    ),
    code: ({ node, inline, ...props }) => {
      if (inline) {
        return (
          <code
            className="bg-gray-700/60 text-cyan-400 px-1.5 py-0.5 rounded font-mono text-sm"
            {...props}
          />
        );
      }
      return <code {...props} />;
    },
    pre: ({ node, ...props }) => (
      <pre className="bg-gray-800/70 border border-gray-700/50 rounded-lg p-4 overflow-x-auto mb-4" {...props} />
    ),
    ul: ({ node, ...props }) => (
      <ul className="list-disc list-inside text-gray-300 mb-4 space-y-1" {...props} />
    ),
    ol: ({ node, ...props }) => (
      <ol className="list-decimal list-inside text-gray-300 mb-4 space-y-1" {...props} />
    ),
    li: ({ node, ...props }) => (
      <li className="text-gray-300" {...props} />
    ),
    blockquote: ({ node, ...props }) => (
      <blockquote className="border-l-4 border-blue-500 bg-gray-800/40 pl-4 py-2 my-4 text-gray-300 italic" {...props} />
    ),
    hr: ({ node, ...props }) => (
      <hr className="my-6 border-gray-700/50" {...props} />
    ),
    table: ({ node, ...props }) => (
      <div className="overflow-x-auto mb-4">
        <table className="w-full border-collapse border border-gray-700/50" {...props} />
      </div>
    ),
    thead: ({ node, ...props }) => (
      <thead className="bg-gray-800/60" {...props} />
    ),
    tbody: ({ node, ...props }) => (
      <tbody className="divide-y divide-gray-700/50" {...props} />
    ),
    tr: ({ node, ...props }) => (
      <tr className="divide-x divide-gray-700/50" {...props} />
    ),
    th: ({ node, ...props }) => (
      <th className="text-left px-3 py-2 text-gray-300 font-semibold" {...props} />
    ),
    td: ({ node, ...props }) => (
      <td className="px-3 py-2 text-gray-400" {...props} />
    ),
  };

  return (
    <div className={`markdown-content ${className}`}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeSanitize]}
        components={components}
      >
        {content || ""}
      </ReactMarkdown>
    </div>
  );
};

export default MarkdownRenderer;
