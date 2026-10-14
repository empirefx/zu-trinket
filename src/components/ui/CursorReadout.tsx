interface CursorReadoutProps {
  cursor: [number, number] | null;
}

export function CursorReadout({ cursor }: CursorReadoutProps) {
  return (
    <div id="cursor-readout" className="absolute bottom-3 right-3 z-50" data-testid="cursor-readout">
      <div className="bg-default/90 backdrop-blur-sm border border-divider rounded-sm px-2 py-0.5">
        {cursor ? (
          <span className="font-mono tabular-nums text-xs text-primary">
            x {cursor[0].toFixed(0)}  y {cursor[1].toFixed(0)}
          </span>
        ) : (
          <span className="text-xs text-muted-foreground">—</span>
        )}
      </div>
    </div>
  );
}