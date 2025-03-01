/**
 * Concatenates multiple CSS class names into a single space-separated string.
 *
 * This function accepts a variable number of class name strings and filters out any falsy values 
 * (such as false, null, undefined, 0, or ''). It then joins the remaining truthy class names with spaces, 
 * making it useful for conditionally constructing CSS class lists.
 *
 * @param classes - A list of CSS class names. Falsy values are omitted.
 * @returns A space-separated string of the provided truthy class names.
 *
 * @example
 * cn('btn', undefined, 'btn-primary') // returns 'btn btn-primary'
 */
export function cn(...classes: string[]) {
  return classes.filter(Boolean).join(' ')
}
