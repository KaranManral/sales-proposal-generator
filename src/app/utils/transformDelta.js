function escapeRegex(string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export function transformDeltaForEditablePlaceholders(
  originalDelta,
  identifiedPlaceholdersArray,
  initialValues = {}
) {
  if (!originalDelta || !originalDelta.ops) return { ops: [] };
  const newOps = [];
  originalDelta.ops.forEach((op) => {
    if (typeof op.insert === "string") {
      let currentText = op.insert;
      let lastIndex = 0;
      let hasReplacements = false;
      const placeholderNames = identifiedPlaceholdersArray.map((ph) =>
        escapeRegex(ph.name)
      );
      if (placeholderNames.length === 0) {
        newOps.push(op);
        return;
      }
      const globalRegex = new RegExp(
        `\\{\\{(${placeholderNames.join("|")})\\}\\}`,
        "g"
      );
      let match;
      while ((match = globalRegex.exec(currentText)) !== null) {
        hasReplacements = true;
        const placeholderName = match[1];
        const matchStartIndex = match.index;
        const matchEndIndex = matchStartIndex + match[0].length;
        if (matchStartIndex > lastIndex) {
          newOps.push({
            ...op,
            insert: currentText.substring(lastIndex, matchStartIndex),
          });
        }
        const placeholderDefinition = identifiedPlaceholdersArray.find(
          (p) => p.name === placeholderName
        );
        const uniqueId =
          placeholderDefinition?.id ||
          `ph_${placeholderName
            .toLowerCase()
            .replace(/\W+/g, "_")}_${Date.now()}`;
        newOps.push({
          insert: {
            "editable-placeholder": {
              // This is the key for your custom blot
              id: uniqueId,
              label:
                placeholderDefinition?.description || `${placeholderName}:`, // Use name if no desc
              initialContent: placeholderName || "",
              originalPlaceholderName: placeholderName,
            },
          },
        });
        lastIndex = matchEndIndex;
      }
      console.log(
        lastIndex,
        currentText.length,
        currentText.substring(lastIndex)
      );
      if (hasReplacements) {
        if (lastIndex < currentText.length) {
          newOps.push({ ...op, insert: currentText.substring(lastIndex) });
        }
      } else {
        newOps.push(op);
      }
    } else {
      newOps.push(op); // Keep non-string ops (like existing embeds)
    }
  });
  return { ops: newOps };
}
