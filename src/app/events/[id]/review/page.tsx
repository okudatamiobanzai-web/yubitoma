"use client";

import { useParams } from "next/navigation";
import { redirect } from "next/navigation";

// Review feature has been removed. Redirect to event page.
export default function EventReviewPage() {
  const params = useParams();
  redirect(`/events/${params.id}`);
}
