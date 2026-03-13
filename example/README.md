# Layout Example

This example demonstrates the three-panel stream overlay layout provided by
[automated-gameplay-transmitter](https://github.com/nahcnuj/automated-gameplay-transmitter).

## Layout

| Panel | Grid area | Description |
|-------|-----------|-------------|
| Main | `col-span-8 / row-span-8` | Game screen area (largest, top-left) |
| Side | `col-span-2 / row-span-8` | Stream info and stats (narrow, right side) |
| Bottom | `col-span-10 / row-span-2` | Speech / captions (full width, bottom strip) |

## Requirements

- [Bun](https://bun.sh) ≥ 1.1

## Getting Started

```sh
# Install dependencies (from the example directory)
bun install

# Start the development server
bun dev
```

Then open [http://localhost:3000](http://localhost:3000) in your browser.
