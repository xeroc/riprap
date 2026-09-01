import type { Meta, StoryObj } from "@storybook/react-vite";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./tabs";

const meta = {
  title: "UI/Tabs",
  component: Tabs,
  parameters: { layout: "centered" },
} satisfies Meta<typeof Tabs>;

export default meta;

export const Default: StoryObj<typeof meta> = {
  render: () => (
    <Tabs defaultValue="mechanism" className="w-96">
      <TabsList>
        <TabsTrigger value="mechanism">mechanism</TabsTrigger>
        <TabsTrigger value="jury">jury</TabsTrigger>
        <TabsTrigger value="payouts">payouts</TabsTrigger>
      </TabsList>
      <TabsContent value="mechanism">
        Fees pile into the pool treasury. Claims drain it through two doors.
      </TabsContent>
      <TabsContent value="jury">
        Drawn from this pool only, stake-weighted, commit-reveal.
      </TabsContent>
      <TabsContent value="payouts">
        Capped per tier: <span data-num>up to $2,000</span>.
      </TabsContent>
    </Tabs>
  ),
};
