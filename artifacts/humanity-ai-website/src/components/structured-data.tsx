import { useEffect, useRef } from "react";

interface StructuredDataProps {
  schema: Record<string, unknown>;
}

export function StructuredData({ schema }: StructuredDataProps) {
  const scriptRef = useRef<HTMLScriptElement | null>(null);

  useEffect(() => {
    const script = document.createElement("script");
    script.type = "application/ld+json";
    script.text = JSON.stringify(schema);
    document.head.appendChild(script);
    scriptRef.current = script;
    return () => {
      if (scriptRef.current && document.head.contains(scriptRef.current)) {
        document.head.removeChild(scriptRef.current);
      }
    };
  }, [JSON.stringify(schema)]);

  return null;
}
