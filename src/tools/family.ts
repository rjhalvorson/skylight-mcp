import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";

import { getCategories } from "../api/endpoints/categories.js";
import { getFrame } from "../api/endpoints/frames.js";
import { getDevices } from "../api/endpoints/devices.js";
import { formatErrorForMcp } from "../utils/errors.js";

export function registerFamilyTools(server: McpServer): void {
  // get_family_members tool
  server.tool(
    "get_family_members",
    `Get all Skylight categories — family member profiles AND non-profile categories (like calendar groupings: "School", "Sports", etc.).

Shows who/what can be assigned to events and chores.

Use this to answer:
- "Who's in our family on Skylight?"
- "What categories exist for tagging events?"
- "Who can I assign chores to?"`,
    {},
    async () => {
      try {
        const categories = await getCategories();

        if (categories.length === 0) {
          return {
            content: [
              {
                type: "text" as const,
                text: "No categories found in Skylight.",
              },
            ],
          };
        }

        const categoryList = categories
          .map((cat) => {
            const attrs = cat.attributes;
            const parts = [`- ${attrs.label ?? "Unnamed"}`];
            parts.push(`  ID: ${cat.id}`);
            parts.push(`  Linked to profile: ${attrs.linked_to_profile ? "Yes" : "No"}`);
            if (attrs.color) {
              parts.push(`  Color: ${attrs.color}`);
            }
            if (attrs.profile_pic_url) {
              parts.push(`  Has profile picture: Yes`);
            }
            if (attrs.selected_for_chore_chart) {
              parts.push(`  On chore chart: Yes`);
            }
            return parts.join("\n");
          })
          .join("\n\n");

        return {
          content: [
            {
              type: "text" as const,
              text: `Categories (profiles + non-profile categories):\n\n${categoryList}`,
            },
          ],
        };
      } catch (error) {
        return {
          content: [
            {
              type: "text" as const,
              text: formatErrorForMcp(error),
            },
          ],
          isError: true,
        };
      }
    }
  );

  // get_frame_info tool
  server.tool(
    "get_frame_info",
    `Get Skylight household/frame information.

Useful for setup verification and debugging.

Use this to answer:
- "Show Skylight household info"
- "What's my frame ID?"`,
    {},
    async () => {
      try {
        const frame = await getFrame();

        const parts = [`Frame ID: ${frame.id}`, `Type: ${frame.type}`];

        // Add any attributes
        const attrs = frame.attributes;
        if (Object.keys(attrs).length > 0) {
          parts.push(`\nAttributes:`);
          for (const [key, value] of Object.entries(attrs)) {
            if (value !== null && value !== undefined) {
              parts.push(`  ${key}: ${JSON.stringify(value)}`);
            }
          }
        }

        return {
          content: [
            {
              type: "text" as const,
              text: parts.join("\n"),
            },
          ],
        };
      } catch (error) {
        return {
          content: [
            {
              type: "text" as const,
              text: formatErrorForMcp(error),
            },
          ],
          isError: true,
        };
      }
    }
  );

  // get_devices tool
  server.tool(
    "get_devices",
    `List Skylight devices in the household.

Use this to answer:
- "What Skylight devices do we have?"
- "How many Skylight frames are connected?"`,
    {},
    async () => {
      try {
        const devices = await getDevices();

        if (devices.length === 0) {
          return {
            content: [
              {
                type: "text" as const,
                text: "No Skylight devices found.",
              },
            ],
          };
        }

        const deviceList = devices
          .map((device) => {
            const parts = [`- Device (ID: ${device.id})`];

            const attrs = device.attributes;
            for (const [key, value] of Object.entries(attrs)) {
              if (value !== null && value !== undefined) {
                parts.push(`  ${key}: ${value}`);
              }
            }

            return parts.join("\n");
          })
          .join("\n\n");

        return {
          content: [
            {
              type: "text" as const,
              text: `Skylight devices:\n\n${deviceList}`,
            },
          ],
        };
      } catch (error) {
        return {
          content: [
            {
              type: "text" as const,
              text: formatErrorForMcp(error),
            },
          ],
          isError: true,
        };
      }
    }
  );
}
