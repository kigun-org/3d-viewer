import { describe, it, expect } from 'vitest'
// import Viewer from "./Viewer.svelte"

describe("Sample test block", () => {
    it("sample test which should be true", () => {
        expect(true).toBe(true)
    })
})

// describe('Test Counter.svelte', async () =>
//     it('Initial counter should be 0', async () => {
//         render(Counter);
//         expect(screen.getByText('0')).toBeInTheDocument();
//     });
//     it('Test increase', async () => {
//         render(Counter);
//         const increaseButton = screen.getByText('Increment');
//         // Increase by one
//         await fireEvent.click(increaseButton);
//         // Wait for animation
//         const counter = await screen.findByText('1');
//         expect(counter).toBeInTheDocument();
//     });
// });