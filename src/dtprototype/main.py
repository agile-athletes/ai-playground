# Copyright (c) 2024 Agile Athletes GmbH.
# The source is part of the open-source project https://github.com/agile-athletes/ai-playground
# and is distributed under the terms of the MIT licence.

from ui.sample_proto import demo

if __name__ == "__main__":
    demo.launch(server_name="0.0.0.0", server_port=7860, share=False)
