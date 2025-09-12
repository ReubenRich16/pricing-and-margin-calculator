// src/components/quote/PasteParser.js
import React from 'react';

// Helper function to map itemType to a broader category
const mapItemTypeToCategory = (itemType) => {
  if (!itemType) return 'Other'; // Default if itemType is null or empty
  const lowerItemType = itemType.toLowerCase();

  // Bulk Insulation
  if (lowerItemType.includes('bulk insulation') || lowerItemType.includes('batt') || lowerItemType.includes('ceiling & wall bulk insulation') || lowerItemType.includes('between floor batts') || lowerItemType.includes('external wall batts') || lowerItemType.includes('party wall batts') || lowerItemType.includes('internal wall batts') || lowerItemType.includes('garage to house wall batts') || lowerItemType.includes('roof ceiling batts')) {
    return 'Bulk Insulation';
  }
  // Rigid Wall/Soffit / XPS
  if (lowerItemType.includes('rigid') || lowerItemType.includes('soffit panels') || lowerItemType.includes('xps') || lowerItemType.includes('wall panel insulation') || lowerItemType.includes('slab on ground - panels')) {
    return 'Rigid Wall/Soffit'; // Grouping XPS under Rigid for now based on CSV
  }
  // Wall Wrap
  if (lowerItemType.includes('wall wrap') || lowerItemType.includes('brane vhp')) {
    return 'Wall Wrap';
  }
  // Fire Protection
  if (lowerItemType.includes('fire protection') || lowerItemType.includes('fireproof')) {
    return 'Fire Protection';
  }
  // Subfloor
  if (lowerItemType.includes('subfloor')) {
    return 'Subfloor';
  }
  // Acoustic Pipe Lagging
  if (lowerItemType.includes('acoustic pipe lagging') || lowerItemType.includes('pipe lagging')) {
    return 'Acoustic Pipe Lagging';
  }
  // Consumables
  if (lowerItemType.includes('consumables') || lowerItemType.includes('tape') || lowerItemType.includes('dampcourse') || lowerItemType.includes('strapping') || lowerItemType.includes('staples')) {
    return 'Consumables';
  }

  return 'Other'; // Default category if no match
};


// The main parsing function - this is the new engine
const parseTextToWorksheet = (text) => {
  // Sanitize non-breaking spaces
  text = text.replace(/\u00A0/g, ' ');

  const lines = text.split('\n').filter(line => line.trim() !== '');
  const worksheet = {
    groups: [],
  };
  let currentGroup = null;
  let currentLineItem = null;
  let pendingGroupPrefix = null; // For "Additional Items:"

  const lineItemRegex = /-\s*(?<descriptionAndStuff>.+?)\s*–\s*(?<area>\d+)m²(?<remainder>.*)/;
  const supplyOnlyLineItemRegex = /^(?<description>.*?)\s*–\s*(?<area>\d+)m²\s*-\s*SUPPLY ONLY/i;
  const groupHeaderRegex = /^U(\d+),\s*(.+?)(?:\s*–\s*(.+))?$/i;
  const dampCourseRegex = /Includes damp course –\s*(?<width>\d+MM)\s*\(\s*(?<length>\d+)LM\)/i;

  lines.forEach(line => {
    const trimmedLine = line.trim();
    
    // Debugging logs for "Additional Items:"
    console.log('Processing line:', line);
    console.log('Trimmed line:', trimmedLine);

    const supplyMatch = trimmedLine.match(supplyOnlyLineItemRegex);

    if (supplyMatch) {
      let supplyGroup = worksheet.groups.find(g => g.groupName === "Supply Only Items");
      if (!supplyGroup) {
        supplyGroup = {
          id: `g-supply-only-${Date.now()}`,
          groupName: "Supply Only Items",
          unitNumber: null,
          location: "Supply Only Items",
          itemType: null,
          category: "Supply Only",
          lineItems: [],
        };
        worksheet.groups.push(supplyGroup);
      }

      const { description, area } = supplyMatch.groups;
      
      const newItem = {
        id: `li-${Date.now()}-${Math.random()}`,
        originalText: trimmedLine,
        description: description.trim(),
        colorHint: null,
        rValue: null,
        quantity: parseFloat(area),
        unit: 'm²',
        notes: [],
        location: "Supply Only Items",
        category: mapItemTypeToCategory(description.trim()),
      };
      supplyGroup.lineItems.push(newItem);
      return;
    }

    if (trimmedLine.startsWith('-')) {
      const match = trimmedLine.match(lineItemRegex);

      if (match && currentGroup) {
        const { descriptionAndStuff, area, remainder } = match.groups;
        let description = descriptionAndStuff;
        let colorHint = null;
        let rValue = null;

        const rValueRegex = /R[\d.]+\s*\w*/;
        const rValueMatch = description.match(rValueRegex);
        if (rValueMatch) {
            rValue = rValueMatch[0].trim();
            description = description.replace(rValueRegex, '').trim();
        }

        const colorHintRegex = /\(Marked\s+([A-Z\s]+)\)/i;
        const colorMatch = description.match(colorHintRegex);
        if (colorMatch) {
            colorHint = colorMatch[1].trim();
            description = description.replace(colorMatch[0], '').trim();
        }
        
        currentLineItem = {
          id: `li-${Date.now()}-${Math.random()}`,
          originalText: trimmedLine,
          description: description.trim().replace(/-\s*$/, '').trim(),
          colorHint: colorHint,
          rValue: rValue,
          quantity: parseFloat(area),
          unit: 'm²',
          notes: [],
          location: currentGroup.location || null, 
          category: currentGroup.category || null,
        };
        currentGroup.lineItems.push(currentLineItem);

        if (remainder && remainder.trim()) {
            // CRITICAL FIX: Remove leading dash/spaces from remainder before processing notes
            let notesContent = remainder.trim().replace(/^\s*[-—]\s*/, ''); 

            const dampCourseMatch = notesContent.match(dampCourseRegex);
            if (dampCourseMatch) {
                const { width, length } = dampCourseMatch.groups;
                const lengthValue = parseInt(length, 10);

                const dampCourseItem = {
                    id: `li-dc-${Date.now()}-${Math.random()}`,
                    originalText: dampCourseMatch[0].trim(),
                    description: "Damp Course",
                    specifications: {
                        width: width,
                        length: lengthValue,
                    },
                    quantity: lengthValue,
                    unit: 'LM',
                    colorHint: null,
                    rValue: null,
                    notes: [],
                    location: currentGroup.location,
                    category: "Consumables",
                };
                currentGroup.lineItems.push(dampCourseItem);
                notesContent = notesContent.replace(dampCourseMatch[0], '').trim();
            }

            if (notesContent) {
                const individualNotes = notesContent.split(/\s{2,}[-—]\s*/).filter(n => n.trim() !== '');
                individualNotes.forEach(note => {
                    // Check if this individual note itself needs further splitting
                    const subNotes = note.split(/\s{2,}[-—]\s*/).filter(n => n.trim() !== '');
                    subNotes.forEach(subNote => {
                        currentLineItem.notes.push(subNote.trim());
                    });
                });
            }
        }

      } else {
        if (currentLineItem) {
          currentLineItem.notes.push(trimmedLine.replace(/^-+/, '').trim());
        }
      }
    } 
    else if (line.startsWith('  —') && currentLineItem) { // New note type: 2 spaces + em-dash
        const noteContent = trimmedLine.substring(3).trim();
        const subNotes = noteContent.split(/\s{2,}[-—]\s*/).filter(n => n.trim() !== '');
        subNotes.forEach(subNote => {
            currentLineItem.notes.push(subNote.trim());
        });
    }
    else if (line.startsWith('   ') && currentLineItem) { // Existing note type: 3 spaces
        const noteContent = trimmedLine;
        const subNotes = noteContent.split(/\s{2,}[-—]\s*/).filter(n => n.trim() !== '');
        subNotes.forEach(subNote => {
            currentLineItem.notes.push(subNote.trim());
        });
    }
    else {
      // Debugging logs for "Additional Items:"
      console.log('Pending prefix (before check):', pendingGroupPrefix);

      // Check for "Additional Items:"
      if (trimmedLine === "Additional Items:") {
        console.log('Matched "Additional Items:"');
        pendingGroupPrefix = trimmedLine;
        return; // Skip pushing this as a separate group
      }

      const groupMatch = trimmedLine.match(groupHeaderRegex);
      let unitNumber = null;
      let location = trimmedLine;
      let itemType = null;
      let category = 'Other';

      if (groupMatch) {
        unitNumber = parseInt(groupMatch[1], 10);
        location = groupMatch[2].trim();
        itemType = groupMatch[3] ? groupMatch[3].trim() : null;
        category = mapItemTypeToCategory(itemType);
      }

      let finalGroupName = trimmedLine;
      if (pendingGroupPrefix) {
        finalGroupName = `${pendingGroupPrefix}\n${trimmedLine}`;
        pendingGroupPrefix = null;
        console.log('Combined group name:', finalGroupName);
      }

      currentGroup = {
        id: `g-${Date.now()}-${Math.random()}`,
        groupName: finalGroupName,
        unitNumber: unitNumber,
        location: location,
        itemType: itemType,
        category: category,
        lineItems: [],
      };
      worksheet.groups.push(currentGroup);
      currentLineItem = null;
    }
  });

  return worksheet;
};


// Your component can now use this powerful parser
const PasteParser = ({ onParse }) => {
  const [text, setText] = React.useState('');

  const handleParse = () => {
    const rawWorksheetData = parseTextToWorksheet(text);
    console.log('Parsed (Raw):', rawWorksheetData);
    onParse(rawWorksheetData);
  };

  return (
    <div>
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        rows={20}
        style={{ width: '100%' }}
        placeholder="Paste your unformatted scope of works here..."
      />
      <button onClick={handleParse} style={{ marginTop: '10px' }}>
        Parse and Generate Quote
      </button>
    </div>
  );
};

export default PasteParser;