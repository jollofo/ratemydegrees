---
description: Improvements to the Rate My Degree review submission flow
---

## Review Flow Pain Points & Solutions

The following improvements were made to address pain points for "indecisive" and "thorough" users during the review submission process.

### 1. Major Selection friction
- **Problem**: Standard text search often failed for specific programmatic names (e.g., "Sym Sys" vs "Symbolic Systems"). Users felt stuck when no results appeared.
- **Solution**: 
    - Integrated `MajorResolverModal` as a fallback "Advanced Search".
    - Added a "Try Advanced Resolver" button when search yields 0 results.
    - Updated search results to display `matchType` badges (e.g., "Alias", "Related") to explain *why* a major was returned.

### 2. Data Integrity on Context Switch
- **Problem**: Changing the selected Institution did NOT clear the selected Major. This allowed users to associate a major valid at Institution A with Institution B, where it might not exist.
- **Solution**: `institutionId` change now triggers `formData.majorId` and `majorQuery` reset.

### 3. Visual Feedback
- **Problem**: Users didn't know if their search was working or if the results were relevant.
- **Solution**: Added Loading states and explicit "No results" states with calls to action.

## Future Improvements (Backlog)

1.  **Smart Form Parsing**: Allow users to type "Biology at Harvard" in the initial search and auto-fill both fields. The API route supports this logic; the frontend action can be updated to use it.
2.  **Validation UI**: Replace `alert()` calls with nice toast notifications or inline error messages for form validation.
3.  **Draft Saving**: persist `formData` to `localStorage` so users don't lose progress if they navigate away (indecisive behavior).
