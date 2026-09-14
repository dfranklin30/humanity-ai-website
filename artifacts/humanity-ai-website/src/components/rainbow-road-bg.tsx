// The page's ambient ground. Formerly a night sky with a rainbow road; now a
// daylight wash so the content — board bios, programs, the funding ask — sits
// on white. Named RainbowRoadBg still so every import keeps working.
export function RainbowRoadBg() {
  return (
    <div className="rainbow-road-bg" aria-hidden="true" data-testid="bg-rainbow-road">
      <div className="rr-wash" />
      <div className="rr-hairline" />
    </div>
  );
}
