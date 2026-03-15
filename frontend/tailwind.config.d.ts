declare const _default: {
    content: string[];
    theme: {
        extend: {
            fontFamily: {
                sans: [string, string, string, string];
                mono: [string, string, string];
            };
            colors: {
                accent: string;
            };
            boxShadow: {
                glow: string;
            };
            animation: {
                float: string;
                pulseSoft: string;
            };
            keyframes: {
                float: {
                    "0%, 100%": {
                        transform: string;
                    };
                    "50%": {
                        transform: string;
                    };
                };
                pulseSoft: {
                    "0%, 100%": {
                        opacity: string;
                    };
                    "50%": {
                        opacity: string;
                    };
                };
            };
        };
    };
    plugins: any[];
};
export default _default;
