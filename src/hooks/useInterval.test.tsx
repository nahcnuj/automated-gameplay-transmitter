import { afterEach, describe, expect, jest, test } from "bun:test";
import React from "react";
import { act, cleanup, render } from "@testing-library/react";
import { useInterval } from "./useInterval";

describe("useInterval", () => {
  afterEach(() => {
    jest.useRealTimers();
    cleanup();
  });

  test("is a function", () => {
    expect(typeof useInterval).toBe("function");
  });

  test("calls callback at the specified interval", async () => {
    jest.useFakeTimers();
    const callback = jest.fn(() => Promise.resolve());

    function TestComponent() {
      useInterval(1000, callback);
      return null;
    }

    render(<TestComponent />);

    expect(callback).not.toHaveBeenCalled();

    await act(async () => {
      jest.advanceTimersByTime(1000);
      await Promise.resolve();
    });
    expect(callback).toHaveBeenCalledTimes(1);
  });

  test("stops calling callback after unmount", async () => {
    jest.useFakeTimers();
    const callback = jest.fn(() => Promise.resolve());

    function TestComponent() {
      useInterval(1000, callback);
      return null;
    }

    const { unmount } = render(<TestComponent />);

    await act(async () => {
      jest.advanceTimersByTime(1000);
      await Promise.resolve();
    });
    expect(callback).toHaveBeenCalledTimes(1);

    unmount();

    await act(async () => {
      jest.advanceTimersByTime(3000);
      await Promise.resolve();
    });
    expect(callback).toHaveBeenCalledTimes(1);
  });
});

