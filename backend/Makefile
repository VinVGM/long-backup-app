.PHONY: build clean deploy-all

FUNCTIONS := upload-request upload-complete list-archives get-archive
BUILD_DIR := build

build: $(FUNCTIONS)

$(FUNCTIONS):
	@echo "Building $@..."
	GOOS=linux GOARCH=amd64 CGO_ENABLED=0 go build -o $(BUILD_DIR)/$@/bootstrap ./cmd/$@
	cd $(BUILD_DIR)/$@ && zip -q function.zip bootstrap
	@echo "  -> $(BUILD_DIR)/$@/function.zip"

clean:
	rm -rf $(BUILD_DIR)

deploy-all: build
	@for fn in $(FUNCTIONS); do \
		echo "Deploying $$fn..."; \
		aws lambda update-function-code \
			--function-name "longbackup-$$fn" \
			--zip-file fileb://$(BUILD_DIR)/$$fn/function.zip \
			--no-cli-pager; \
	done
	@echo "All functions deployed."

deploy-%: build
	@echo "Deploying $*..."
	aws lambda update-function-code \
		--function-name "longbackup-$*" \
		--zip-file fileb://$(BUILD_DIR)/$*/function.zip \
		--no-cli-pager
