export const stripMarkdown = (text) => {
  return text
    .replace(/\*\*(.*?)\*\*/g, '$1')
    .replace(/\*(.*?)\*/g, '$1')
    .replace(/`(.*?)`/g, '$1')
    .replace(/#+\s*(.*)/g, '$1')
    .replace(/!\[.*\]\(.*\)/g, '')
    .replace(/\[.*\]\(.*\)/g, '')
    .trim();
};
