import { defineField, defineType } from "sanity";

export const conventionType = defineType({
  name: "convention",
  title: "Convention",
  type: "document",
  fields: [
    defineField({
      name: "name",
      title: "Name",
      type: "string",
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "slug",
      title: "Slug",
      type: "slug",
      options: { source: "name", maxLength: 96 },
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "dates",
      title: "Dates",
      type: "string",
      description: 'e.g. "Jan 20–23, 2026"',
    }),
    defineField({
      name: "location",
      title: "Location",
      type: "string",
      description: 'e.g. "Las Vegas, NV"',
    }),
    defineField({
      name: "attendeeCount",
      title: "Attendee count",
      type: "number",
      description: "Optional, for display on cards",
    }),
    defineField({
      name: "targetListCsv",
      title: "Target list (CSV)",
      type: "file",
      description: "Company-level CSV (e.g. WoC-style)",
      options: { accept: ".csv" },
    }),
    defineField({
      name: "attendeeListCsv",
      title: "Attendee list (CSV)",
      type: "file",
      description: "Person-level CSV (e.g. Shoptalk-style)",
      options: { accept: ".csv" },
    }),
  ],
  orderings: [
    { title: "Dates (new first)", name: "datesDesc", by: [{ field: "dates", direction: "desc" }] },
  ],
});
