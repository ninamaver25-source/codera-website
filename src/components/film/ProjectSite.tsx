import { Noir } from "../home/sites/Noir";
import { Stack } from "../home/sites/Stack";
import { Pinnacle } from "../home/sites/Pinnacle";
import { Vela } from "../home/sites/Vela";
import type { ProjectSlug } from "./projects";

/** The website of one project. */
export function ProjectSite({ slug }: { slug: ProjectSlug }) {
  switch (slug) {
    case "noir":
      return <Noir />;
    case "stack":
      return <Stack />;
    case "pinnacle":
      return <Pinnacle />;
    case "vela":
      return <Vela />;
  }
}
