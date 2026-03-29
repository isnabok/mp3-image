import { ImageResponse } from "next/og";

import { siteMessages } from "@/lib/i18n";
import { SocialShare } from "@/app/social-share";

export const alt = "MP3 Tag Editor social preview";
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = "image/png";

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <SocialShare
        title={siteMessages.header.title}
        description={siteMessages.meta.description}
      />
    ),
    size,
  );
}
