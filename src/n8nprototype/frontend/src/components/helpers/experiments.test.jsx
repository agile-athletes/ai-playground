// selectNewWorkflow.test.js

import { selectNewWorkflow } from './experiments';

describe("selectNewWorkflow", () => {
    it("should throw an error if workflows is not an array", () => {
        expect(() => selectNewWorkflow(null, 1)).toThrow("Expected workflows to be an array.");
        expect(() => selectNewWorkflow("not-an-array", 1)).toThrow("Expected workflows to be an array.");
    });

    it("should set the selected property to true for the workflow with the matching id and false for others", () => {
        const workflows = [
            { id: 1, value: { selected: true } },
            { id: 2, value: { selected: false } },
            { id: 3, value: { selected: true } }
        ];

        const expected = [
            { id: 1, value: { selected: false } },
            { id: 2, value: { selected: true } },
            { id: 3, value: { selected: false } }
        ];

        const result = selectNewWorkflow(workflows, 2);
        expect(result).toEqual(expected);
    });

    it("should leave workflows unchanged if they do not have a value object", () => {
        const workflows = [
            { id: 1 },
            { id: 2 }
        ];

        const result = selectNewWorkflow(workflows, 1);
        expect(result).toEqual(workflows);
    });

    it("should work correctly when none of the workflows are initially selected", () => {
        const workflows = [
            { id: 1, value: { selected: false } },
            { id: 2, value: { selected: false } },
            { id: 3, value: { selected: false } }
        ];

        const expected = [
            { id: 1, value: { selected: false } },
            { id: 2, value: { selected: true } },
            { id: 3, value: { selected: false } }
        ];

        const result = selectNewWorkflow(workflows, 2);
        expect(result).toEqual(expected);
    });
});
