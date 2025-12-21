"use client"

import * as React from "react"
import * as RechartsPrimitive from "recharts"

import { cn } from "@/lib/utils"

// Configuration du graphique avec labels et couleurs
export interface ChartConfig {
  [key: string]: {
    label?: React.ReactNode
    icon?: React.ComponentType
    color?: string
    theme?: {
      light: string
      dark: string
    }
  }
}

// Props pour ChartContainer
interface ChartContainerProps extends React.HTMLAttributes<HTMLDivElement> {
  config: ChartConfig
  children: React.ComponentProps<
    typeof RechartsPrimitive.ResponsiveContainer
  >["children"]
  className?: string
}

// Composant ChartContainer qui enveloppe ResponsiveContainer
const ChartContainer = React.forwardRef<HTMLDivElement, ChartContainerProps>(
  ({ id, className, children, config, ...props }, ref) => {
    const uniqueId = React.useId()
    const chartId = `chart-${id || uniqueId.replace(/:/g, "")}`

    return (
      <div
        data-chart={chartId}
        ref={ref}
        className={cn(
          "flex aspect-video justify-center text-xs [&_.recharts-cartesian-axis-tick_text]:fill-muted-foreground [&_.recharts-cartesian-grid_line[stroke='#ccc']]:stroke-border/50 [&_.recharts-curve.recharts-tooltip-cursor]:stroke-border [&_.recharts-dot[stroke='#fff']]:stroke-transparent [&_.recharts-layer]:outline-none [&_.recharts-polar-grid_[stroke='#ccc']]:stroke-border [&_.recharts-radial-bar-background-sector]:fill-muted [&_.recharts-rectangle.recharts-tooltip-cursor]:fill-muted [&_.recharts-reference-line-line]:stroke-border [&_.recharts-sector[stroke='#fff']]:stroke-transparent [&_.recharts-sector]:outline-none [&_.recharts-surface]:outline-none",
          className
        )}
        {...props}
      >
        <ChartStyle id={chartId} config={config} />
        <RechartsPrimitive.ResponsiveContainer>
          {children}
        </RechartsPrimitive.ResponsiveContainer>
      </div>
    )
  }
)
ChartContainer.displayName = "Chart"

// Composant pour injecter les styles CSS variables
const ChartStyle = ({ id, config }: { id: string; config: ChartConfig }) => {
  const colorConfig = Object.entries(config).filter(
    ([_, config]) => config.theme || config.color
  )

  if (!colorConfig.length) {
    return null
  }

  // Générer les styles CSS pour les variables de couleur
  const lightStyles = Object.entries(config)
    .filter(([_, config]) => config.theme || config.color)
    .map(
      ([key, itemConfig]) =>
        `  --color-${key}: ${itemConfig.theme ? itemConfig.theme.light : itemConfig.color};`
    )
    .join("\n")

  const darkStyles = Object.entries(config)
    .filter(([_, config]) => config.theme)
    .map(
      ([key, itemConfig]) =>
        `  --color-${key}: ${itemConfig.theme?.dark};`
    )
    .join("\n")

  const css = `[data-chart=${id}] {
${lightStyles}
}

.dark [data-chart=${id}] {
${darkStyles}
}`

  return (
    <style
      dangerouslySetInnerHTML={{
        __html: css,
      }}
    />
  )
}

// Props pour ChartTooltip
interface ChartTooltipProps
  extends React.ComponentProps<typeof RechartsPrimitive.Tooltip<any, any>> {
  hideLabel?: boolean
  hideIndicator?: boolean
  indicator?: "line" | "dot" | "dashed"
  nameKey?: string
  labelKey?: string
  payload?: any[]
  active?: boolean
  className?: string
  label?: any
  labelFormatter?: any
  labelClassName?: string
  formatter?: any
}

// Composant ChartTooltip
const ChartTooltip = ({
  active,
  payload,
  className,
  indicator = "dot",
  hideLabel = false,
  hideIndicator = false,
  label,
  labelFormatter,
  labelClassName,
  formatter,
  nameKey,
  labelKey,
  ...props
}: ChartTooltipProps) => {
  // Filtrer les props Recharts personnalisées qui ne sont pas des props HTML standard
  const {
    separator,
    wrapperClassName,
    contentStyle,
    itemStyle,
    cursor,
    coordinate,
    offset,
    viewBox,
    activeCoordinate,
    allowEscapeViewBox,
    animationBegin,
    animationDuration,
    animationEasing,
    isAnimationActive,
    filterNull,
    ...htmlProps
  } = props as any
  const tooltipLabel = React.useMemo(() => {
    if (hideLabel || !payload?.length) {
      return null
    }

    const [item] = payload
    const key = `${labelKey || item.dataKey || item.name || "value"}`
    const itemConfig = item.payload?.chartConfig?.[key]

    if (labelFormatter) {
      return (
        <div className={cn("font-medium", labelClassName)}>
          {labelFormatter(label, payload)}
        </div>
      )
    }

    if (!label) {
      return null
    }

    return <div className={cn("font-medium", labelClassName)}>{label}</div>
  }, [
    label,
    labelFormatter,
    payload,
    hideLabel,
    labelClassName,
    labelKey,
  ])

  if (!active || !payload?.length) {
    return null
  }

  return (
    <div
      className={cn(
        "grid min-w-[8rem] items-start gap-1.5 rounded-lg border border-border/50 bg-background px-2.5 py-1.5 text-xs shadow-md",
        className
      )}
      {...htmlProps}
    >
      {tooltipLabel}
      <div className="grid gap-1.5">
        {payload.map((item, index) => {
          const key = `${item.dataKey || item.name || "value"}`
          const itemConfig = item.payload?.chartConfig?.[key] || {}
          const indicatorColor = item.payload?.fill || item.color

          return (
            <div
              key={item.dataKey || index}
              className={cn(
                "flex w-full flex-wrap items-stretch gap-2 [&>svg]:h-2.5 [&>svg]:w-2.5 [&>svg]:text-muted-foreground",
                indicator === "dot" && "items-center"
              )}
            >
              {formatter && item?.value !== undefined && item.name ? (
                formatter(item.value, item.name, item, index, item.payload)
              ) : (
                <>
                  {!hideIndicator && (
                    <div
                      className={cn(
                        "shrink-0 rounded-[2px] border-[--color-border] bg-[--color-bg]",
                        {
                          "h-2.5 w-2.5": indicator === "dot",
                          "w-1": indicator === "line",
                          "w-0 border-[1.5px] border-dashed bg-transparent":
                            indicator === "dashed",
                          "my-0.5": indicator === "dashed",
                        }
                      )}
                      style={
                        {
                          "--color-bg": indicatorColor,
                          "--color-border": indicatorColor,
                        } as React.CSSProperties
                      }
                    />
                  )}
                  <div
                    className={cn(
                      "flex flex-1 justify-between leading-none",
                      hideIndicator ? "items-end" : "items-center"
                    )}
                  >
                    <div className="grid gap-1.5">
                      <span className="text-muted-foreground">
                        {itemConfig?.label || item.name}
                      </span>
                      {item.value && (
                        <span className="font-mono font-medium tabular-nums text-foreground">
                          {item.value.toLocaleString()}
                        </span>
                      )}
                    </div>
                    {itemConfig?.icon && (
                      <itemConfig.icon className="h-3 w-3" />
                    )}
                  </div>
                </>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

// Props pour ChartTooltipContent
interface ChartTooltipContentProps extends ChartTooltipProps {
  hideLabel?: boolean
  hideIndicator?: boolean
  indicator?: "line" | "dot" | "dashed"
  nameKey?: string
  labelKey?: string
}

// Composant ChartTooltipContent
const ChartTooltipContent = React.forwardRef<
  HTMLDivElement,
  ChartTooltipContentProps
>(({ className, ...props }, ref) => (
  <ChartTooltip className={className} {...props} />
))
ChartTooltipContent.displayName = "ChartTooltip"

// Export de tous les composants Recharts
export {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartStyle,
}

// Réexport de tous les composants Recharts pour faciliter l'import
export const ChartLegend = RechartsPrimitive.Legend
export const ChartLegendContent = RechartsPrimitive.Legend

