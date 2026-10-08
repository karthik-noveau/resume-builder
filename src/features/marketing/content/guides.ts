export interface ResumeGuide {
  slug: string
  title: string
  description: string
  label: string
  introduction: string
  sections: { title: string; paragraphs: string[]; checklist?: string[] }[]
}

export const RESUME_GUIDES: ResumeGuide[] = [
  {
    slug: 'ats-resume',
    title: 'How to prepare an ATS-friendly resume',
    description: 'Make your resume easier to read with a simple layout, clear section headings, relevant experience, and a selectable-text PDF. Use this practical checklist.',
    label: 'CLARITY FIRST',
    introduction: 'An applicant tracking system may extract your resume into fields before a recruiter reads it. A clear document helps both readers. No template or score can guarantee how every hiring system will process a file.',
    sections: [
      {
        title: 'Start with a straightforward layout',
        paragraphs: ['Choose a simple, single-column template when you do not know which system will receive your application. Keep your name and contact details in the main content, and use familiar headings such as Experience, Education, and Skills.', 'Avoid relying on icons, photographs, or charts to communicate a skill or contact detail. If a visual element disappears, the important information should still be readable as text.'],
      },
      {
        title: 'Match the role with evidence',
        paragraphs: ['Read the job description and identify the skills you actually have. Use the employer’s terminology where it accurately describes your experience. Explain what you did, which tools you used, and what changed because of your work.', 'For example, “Built a weekly inventory report in Excel, reducing manual reconciliation from three hours to one” is more useful than a list of unrelated keywords. Only include results you can substantiate.'],
      },
      {
        title: 'Check the exported file',
        paragraphs: ['Follow the application’s file-format instructions. When PDF is accepted, export a text-based PDF rather than a scan or screenshot. Copy a paragraph from the file into a plain-text editor and check the reading order.', 'Resume Builder’s ATS review uses a local rubric to flag content and layout issues. Treat it as a revision checklist; it is not a result from an employer’s ATS or a prediction of an interview.'],
        checklist: ['Contact details are readable text.', 'Section headings describe the content underneath.', 'Skills and keywords reflect real experience.', 'The PDF contains selectable text in a sensible order.', 'The application preview and extracted fields are correct.'],
      },
    ],
  },
  {
    slug: 'resume-format',
    title: 'How to choose a resume format',
    description: 'Choose a resume layout that suits your experience. Compare simple and modern templates, organize your sections, and keep the most relevant work easy to find.',
    label: 'MAKE ROOM FOR YOUR STORY',
    introduction: 'Your layout should make the evidence for your next role easy to find. Start with the experience you need to communicate, then choose a template that gives that content enough room.',
    sections: [
      {
        title: 'Choose the structure before the styling',
        paragraphs: ['For an experienced applicant, recent relevant work usually deserves the most space. Put roles in reverse chronological order and use short bullets to explain achievements and responsibilities. For an early-career applicant, education, projects, internships, and relevant skills can lead.', 'Changing careers does not require hiding your work history. A brief summary can connect your existing experience to the role, followed by examples of transferable skills in your experience or projects.'],
      },
      {
        title: 'Compare one and two columns',
        paragraphs: ['A single column gives the reader a straightforward path from the top to the bottom. It is a useful starting point for text-heavy experience and applications where parsing matters.', 'Two columns can group compact information such as skills beside longer experience entries. Check that the visual order is obvious and that the exported text reads sensibly. Choose the simpler layout if the application’s preview rearranges your information.'],
      },
      {
        title: 'Edit for relevance, then adjust the spacing',
        paragraphs: ['Use readable type, consistent dates, and enough space between sections. Remove repeated or less relevant content before shrinking the font. The right length depends on your experience and the application requirements; filling a page is not a goal by itself.', 'In Resume Builder, you can switch templates without re-entering your content. Compare a simple and a modern design, then inspect every page in Preview & export before downloading.'],
        checklist: ['The most relevant experience is easy to find.', 'Dates and heading styles are consistent.', 'Bullets describe distinct contributions.', 'There are no clipped lines or accidental extra pages.', 'The design still reads comfortably at normal size.'],
      },
    ],
  },
  {
    slug: 'resume-pdf-checklist',
    title: 'Your resume PDF checklist before applying',
    description: 'Review your resume PDF before sending it: check contact details, text selection, links, page breaks, file requirements, and a backup of your editable resume.',
    label: 'READY TO SEND',
    introduction: 'A good-looking editor preview is one part of the job. Review the downloaded file itself so you know what the recipient will open.',
    sections: [
      {
        title: 'Read it as a new reader',
        paragraphs: ['Start with your name, email address, phone number, and portfolio links. Confirm that the role titles, employers, dates, and qualifications are accurate. Read your summary and bullets out loud to catch missing words and awkward phrasing.', 'Use concrete descriptions of your work and verify any numbers. Remove placeholder content, irrelevant details, and skills you would not be comfortable discussing.'],
      },
      {
        title: 'Inspect every exported page',
        paragraphs: ['Open Preview & export, then review the PDF at a readable zoom level. Look at the bottom of each page for clipped text or a heading separated from the content it introduces. Check that any profile image is intentional and appropriate for the application.', 'Select and copy text from the PDF to check that it is text rather than a flattened picture. Open the links and verify their destinations. Follow the employer’s size and format requirements, even if they request a format other than PDF.'],
        checklist: ['Email, phone, and links are correct.', 'There are no placeholders or unsupported claims.', 'All pages have readable text and clean page breaks.', 'Copied text follows a sensible reading order.', 'The file meets the application’s upload requirements.'],
      },
      {
        title: 'Keep the editable version too',
        paragraphs: ['Use a clear filename such as Firstname-Lastname-Resume.pdf. After uploading, inspect the employer’s preview and correct any extracted fields that need attention.', 'Your PDF is the finished document. Resume Builder saves the editable version in the current browser on the current device. Download an editable backup from Settings before clearing site data or moving devices. Keep that backup somewhere private because it contains your resume details.'],
      },
    ],
  },
]
