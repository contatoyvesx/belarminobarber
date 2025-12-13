import * as React from "react";

import { cn } from "@/lib/utils";

export type ChartConfig = {
  [k in string]: {
    label?: React.ReactNode;
    icon?: React.ComponentType;
    color?: string;
  };
};

type ChartContextProps = {
  config: ChartConfig;
};

const ChartContext = React.createContext<ChartContextProps | null>(null);

function useChart() {
  const context = React.useContext(ChartContext);

  if (!context) {
    throw new Error("useChart must be used within a <ChartContainer />");
  }

  return context;
}

function ChartContainer({
  id,
  className,
  children,
  config,
  ...props
}: React.ComponentProps<"div"> & {
  config: ChartConfig;
  children?: React.ReactNode;
}) {
  const uniqueId = React.useId();
  const chartId = `chart-${id || uniqueId.replace(/:/g, "")}`;

  return (
    <ChartContext.Provider value={{ config }}>
      <div
        data-slot="chart"
        data-chart={chartId}
        className={cn(
          "flex aspect-video items-center justify-center rounded-lg border border-border/50 bg-muted/10 text-sm",
          className
        )}
        {...props}
      >
        <p className="text-muted-foreground text-center">
          Gráficos indisponíveis no momento.
        </p>
        {children}
      </div>
    </ChartContext.Provider>
  );
}

function ChartStyle() {
  return null;
}

function ChartTooltip() {
  return null;
}

function ChartTooltipContent() {
  return null;
}

function ChartLegend() {
  return null;
}

function ChartLegendContent() {
  return null;
}

export {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
  ChartStyle,
};
