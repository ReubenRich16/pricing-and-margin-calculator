import React from 'react';
import { parseWorksheetText } from '../../utils/parser';
import { useMaterials } from '../../contexts/MaterialsContext';

// --- REACT COMPONENT ---
const PasteParser = ({ onParse }) => {
    const [text, setText] = React.useState('');
    const { materials } = useMaterials();

    const handleParse = () => {
        const rawWorksheetData = parseWorksheetText(text, materials);
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
