import React from 'react';
import { parseWorksheetText } from '../../utils/parser';
import { aggregateWorksheet } from '../../utils/aggregation';

const PasteParser = ({ onParse, materials }) => {
    const [text, setText] = React.useState('');

    const handleParse = () => {
        const rawWorksheetData = parseWorksheetText(text);
        const aggregatedData = aggregateWorksheet(rawWorksheetData, materials);
        onParse(aggregatedData);
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
            <button onClick={handleParse} className="btn btn-primary mt-3">
                Parse and Generate Quote
            </button>
        </div>
    );
};

export default PasteParser;
