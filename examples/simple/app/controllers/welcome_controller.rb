class WelcomeController < ApplicationController
  around_filter :hypernova_render_support
  def index
  end
end
