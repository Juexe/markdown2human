<script setup lang="ts">
import type { HTMLAttributes } from 'vue'
import { CircleHelp } from 'lucide-vue-next'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'

interface Props {
  text: string
  class?: HTMLAttributes['class']
}

const props = defineProps<Props>()
</script>

<template>
  <TooltipProvider :delay-duration="120">
    <Tooltip>
      <TooltipTrigger as-child>
        <button
          type="button"
          :class="
            cn(
              'inline-flex size-4.5 shrink-0 cursor-help items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] focus-visible:outline-hidden',
              props.class,
            )
          "
          aria-label="查看设置说明"
        >
          <CircleHelp class="size-3.5" />
        </button>
      </TooltipTrigger>
      <TooltipContent side="top" :side-offset="8">
        {{ text }}
      </TooltipContent>
    </Tooltip>
  </TooltipProvider>
</template>
