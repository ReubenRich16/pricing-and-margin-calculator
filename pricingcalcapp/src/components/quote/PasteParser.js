// src/components/quote/PasteParser.js
import React, { useState } from 'react';
import PasteParserInput from './PasteParserInput';
import PasteParserReview from './PasteParserReview';

const PasteParser = ({ materials, labourRates, onParse }) => {
    const [parsedGroups, setParsedGroups] = useState([]);
    const [unmatchedItems, setUnmatchedItems] = useState([]);

    // When input parsing is complete, update groups and unmatched items
    const handleParse = (groups) => {
        setParsedGroups(groups);
        // Collect unmatched items from all groups
        const unmatched = [];
        groups.forEach(group => {
            (group.lineItems || []).forEach(item => {
                if (item.unmatched) unmatched.push(item);
            });
        });
        setUnmatchedItems(unmatched);
        if (onParse) onParse(groups);
    };

    // When review assignment is updated, pass new groups upward as needed
    const handleAssign = (updatedGroups) => {
        setParsedGroups(updatedGroups);
        // Update unmatched items
        const unmatched = [];
        updatedGroups.forEach(group => {
            (group.lineItems || []).forEach(item => {
                if (item.unmatched) unmatched.push(item);
            });
        });
        setUnmatchedItems(unmatched);
        if (onParse) onParse(updatedGroups);
    };

    return (
        <div>
            <PasteParserInput
                materials={materials}
                onParse={handleParse}
            />
            <PasteParserReview
                materials={materials}
                parsedGroups={parsedGroups}
                unmatchedItems={unmatchedItems}
                setUnmatchedItems={setUnmatchedItems}
                setParsedGroups={setParsedGroups}
                onAssign={handleAssign}
            />
        </div>
    );
};

export default PasteParser;